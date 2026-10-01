// _shared/aiProviders.ts
// Unified AI provider router — supports Google Gemini and Anthropic Claude.
// Provider and model are resolved at runtime from model_configs table.

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string | Array<{ type: string; [key: string]: unknown }>
}

export interface AiRequestOptions {
  provider: 'google' | 'anthropic' | 'openai' | 'groq'
  modelName: string
  apiKey: string
  systemPrompt: string
  messages: AiMessage[]
  parameters?: {
    temperature?: number
    max_tokens?: number
    [key: string]: unknown
  }
}

export interface AiResponse {
  content: string
  tokensUsed: number
  inputTokens: number
  outputTokens: number
  rawResponse: unknown
}

export interface ProviderErrorDetails {
  provider: 'google' | 'anthropic' | 'openai' | 'groq'
  httpStatus: number
  providerCode?: string
  providerMessage?: string
  rawBody?: unknown
  isTransient: boolean
  modelUsed?: string
}

export class AiProviderError extends Error {
  readonly details: ProviderErrorDetails

  constructor(message: string, details: ProviderErrorDetails) {
    super(message)
    this.name = 'AiProviderError'
    this.details = details
  }
}

// ---- Google Gemini ----
async function callGemini(opts: AiRequestOptions): Promise<AiResponse> {
  const { apiKey, systemPrompt, messages, parameters } = opts

  // Model failover list: RFC 021 Multi-Tier Failover
  // 1. Primary requested (gemini-3.5-flash)
  // 2. Secondary Flash (gemini-3.6-flash)
  // 3. Fallback Active Flash (gemini-2.5-flash)
  // (Note: gemini-2.0-flash excluded as Google retired it in June 2026)
  const candidateModels = [opts.modelName]
  const flashFallbacks = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-2.5-flash']
  for (const fallback of flashFallbacks) {
    if (!candidateModels.includes(fallback)) {
      candidateModels.push(fallback)
    }
  }

  // Build contents array: system instruction + conversation with multimodal support
  const contents = messages.map((m) => {
    let parts: any[] = []
    if (Array.isArray(m.content)) {
      parts = m.content.map((part) => {
        if (typeof part === 'string') return { text: part }
        return part
      })
    } else if (typeof m.content === 'object' && m.content !== null) {
      parts = [m.content]
    } else {
      parts = [{ text: String(m.content ?? '') }]
    }
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts,
    }
  })

  // DeepSeek & ChatGPT Consensus: SLA Latency & Full Jitter Exponential Backoff
  const SLA_DEADLINE_MS = 9000
  const MIN_ATTEMPT_TIME_MS = 500
  const BASE_DELAY_MS = 300
  const MAX_DELAY_MS = 2000
  const startTime = performance.now()

  let lastStatus = 0
  let lastErr = ''
  let lastProviderCode = ''
  let lastModelTried = opts.modelName
  let totalAttempts = 0

  for (const currentModel of candidateModels) {
    lastModelTried = currentModel

    const generationConfig: Record<string, any> = {
      temperature: parameters?.temperature ?? 0.2,
      maxOutputTokens: parameters?.max_tokens ?? 2500,
    }

    const responseMimeType = parameters?.response_mime_type || parameters?.responseMimeType
    if (responseMimeType) {
      generationConfig.responseMimeType = String(responseMimeType)
    }

    const responseSchema = parameters?.response_schema || parameters?.responseSchema
    if (responseSchema) {
      generationConfig.responseSchema = responseSchema
    }

    // Thinking config based on model family (RFC 021 Amendment):
    // Gemini 2.5 supports thinkingBudget (0 for fast-scan, -1 for dynamic/deep).
    // Gemini 3.x does not support true thinking-off, uses thinkingLevel ('minimal' or 'high').
    const is25 = currentModel.startsWith('gemini-2.5')
    if (parameters?.thinking_budget !== undefined && parameters?.thinking_budget !== null) {
      const budgetNum = Number(parameters.thinking_budget)
      if (is25) {
        generationConfig.thinkingConfig = { thinkingBudget: budgetNum }
      } else {
        generationConfig.thinkingConfig = { thinkingLevel: budgetNum === 0 ? 'minimal' : 'high' }
      }
    }

    const body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig,
    }

    // Up to 2 retry attempts per candidate model
    for (let modelAttempt = 0; modelAttempt < 2; modelAttempt++) {
      const remainingTime = SLA_DEADLINE_MS - (performance.now() - startTime)
      if (remainingTime < MIN_ATTEMPT_TIME_MS) {
        console.warn(`[callGemini] Execution budget exhausted (${Math.round(performance.now() - startTime)}ms), breaking retry loop.`)
        break
      }

      if (totalAttempts > 0) {
        // Full Jitter Backoff (DeepSeek formula): random(0, min(cap, base * 2^attempt))
        const rawDelay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(2, totalAttempts - 1))
        const jitterDelay = Math.floor(Math.random() * rawDelay)
        if (jitterDelay + MIN_ATTEMPT_TIME_MS > remainingTime) {
          console.warn(`[callGemini] Not enough time for backoff delay (${jitterDelay}ms), breaking.`)
          break
        }
        await new Promise((r) => setTimeout(r, jitterDelay))
      }

      totalAttempts++

      // Per-attempt AbortController with remaining time
      const attemptRemaining = SLA_DEADLINE_MS - (performance.now() - startTime)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), Math.max(1000, attemptRemaining))

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          }
        )
        clearTimeout(timeoutId)

        if (!res.ok) {
          lastStatus = res.status
          lastErr = await res.text()

          try {
            const parsedErr = JSON.parse(lastErr)
            lastProviderCode = parsedErr?.error?.status || ''
          } catch {
            // raw string
          }

          console.warn(`[callGemini] Model ${currentModel} attempt ${modelAttempt + 1} returned ${res.status}: ${lastErr.slice(0, 150)}`)

          // Daily quota exhaustion: do not retry this model, switch immediately
          if (res.status === 429 && (lastErr.includes('RESOURCE_EXHAUSTED') || lastErr.includes('PerDay') || lastErr.includes('quota'))) {
            console.warn(`[callGemini] Daily quota exceeded for ${currentModel}, switching to fallback model immediately.`)
            break
          }

          // Transient error: retry or next model
          if (res.status === 503 || res.status === 429) {
            continue
          }

          // Non-transient error (e.g. 400 Bad Request, 403 Forbidden): fail immediately
          throw new AiProviderError(`Gemini error ${res.status}`, {
            provider: 'google',
            httpStatus: res.status,
            providerCode: lastProviderCode || 'CLIENT_ERROR',
            providerMessage: lastErr,
            rawBody: lastErr,
            isTransient: false,
            modelUsed: currentModel,
          })
        }

        const data = await res.json()
        const parts: any[] = data.candidates?.[0]?.content?.parts ?? []
        const content = parts
          .filter((p: any) => typeof p.text === 'string')
          .map((p: any) => p.text)
          .join('')

        if (!content) {
          throw new AiProviderError('Gemini returned empty content', {
            provider: 'google',
            httpStatus: 502,
            providerCode: 'EMPTY_CONTENT',
            rawBody: data,
            isTransient: true,
            modelUsed: currentModel,
          })
        }

        const inputTokens = data.usageMetadata?.promptTokenCount ?? 0
        const outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0
        const _thoughtsTokens = data.usageMetadata?.thoughtsTokenCount ?? 0
        const tokensUsed = inputTokens + outputTokens
        console.log(`[callGemini] [TELEMETRY] model=${currentModel} (fallback=${currentModel !== opts.modelName}) inTokens=${inputTokens} outTokens=${outputTokens} total=${tokensUsed}`)

        return { content, tokensUsed, inputTokens, outputTokens, rawResponse: data }
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (err instanceof AiProviderError && !err.details.isTransient) {
          throw err
        }
        if (err.name === 'AbortError') {
          console.warn(`[callGemini] Model ${currentModel} timed out under deadline budget.`)
        }
      }
    }
  }

  // All attempts exhausted: throw typed AiProviderError
  const isQuotaExhausted = lastStatus === 429 || lastErr.includes('RESOURCE_EXHAUSTED') || lastErr.includes('quota')
  throw new AiProviderError(
    isQuotaExhausted ? 'Gemini API quota exhausted' : 'Gemini API temporarily unavailable',
    {
      provider: 'google',
      httpStatus: lastStatus || 503,
      providerCode: lastProviderCode || (isQuotaExhausted ? 'RESOURCE_EXHAUSTED' : 'UNAVAILABLE'),
      providerMessage: lastErr || 'Model overloaded. All retry and fallback attempts failed.',
      rawBody: lastErr,
      isTransient: !isQuotaExhausted,
      modelUsed: lastModelTried,
    }
  )
}

// ---- Anthropic Claude ----
async function callClaude(opts: AiRequestOptions): Promise<AiResponse> {
  const { modelName, apiKey, systemPrompt, messages, parameters } = opts

  // Extended Thinking: enabled when thinking_budget is set (> 0)
  const thinkingBudget = typeof parameters?.thinking_budget === 'number'
    ? parameters.thinking_budget
    : undefined
  const useThinking = thinkingBudget !== undefined && thinkingBudget > 0

  // Build request body — temperature must be omitted (or 1) when thinking is enabled
  const body: Record<string, unknown> = {
    model: modelName,
    max_tokens: parameters?.max_tokens ?? 2000,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  }

  if (useThinking) {
    // Anthropic Extended Thinking: temperature must be 1 (required by API)
    body.temperature = 1
    body.thinking = { type: 'enabled', budget_tokens: thinkingBudget }
  } else {
    body.temperature = parameters?.temperature ?? 0.7
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  }
  if (useThinking) {
    headers['anthropic-beta'] = 'interleaved-thinking-2025-05-14'
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json()

  // Extended Thinking responses include a {type:"thinking"} block before the
  // actual {type:"text"} block. Concatenate all text blocks into full content.
  const contentBlocks: any[] = Array.isArray(data.content) ? data.content : []
  const content = contentBlocks
    .filter((b: any) => b.type === 'text' && typeof b.text === 'string')
    .map((b: any) => b.text)
    .join('')

  if (!content) {
    throw new Error(`Claude returned empty content. Raw: ${JSON.stringify(data).slice(0, 400)}`)
  }

  const inputTokens = data.usage?.input_tokens ?? 0
  const outputTokens = data.usage?.output_tokens ?? 0
  const tokensUsed = inputTokens + outputTokens

  return { content, tokensUsed, inputTokens, outputTokens, rawResponse: data }
}

// ---- Groq (OpenAI-Compatible LPU) ----
async function callGroq(opts: AiRequestOptions): Promise<AiResponse> {
  const { modelName, apiKey, systemPrompt, messages, parameters } = opts

  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => {
      let contentStr = ''
      if (typeof m.content === 'string') {
        contentStr = m.content
      } else if (Array.isArray(m.content)) {
        contentStr = m.content
          .map((part: any) => (typeof part === 'string' ? part : part.text ?? ''))
          .join('\n')
      } else {
        contentStr = String(m.content ?? '')
      }
      return {
        role: m.role,
        content: contentStr,
      }
    }),
  ]

  const body = {
    model: modelName,
    messages: groqMessages,
    temperature: parameters?.temperature ?? 0.7,
    max_tokens: Math.min(parameters?.max_tokens ?? 800, 800),
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ''
  const inputTokens = data.usage?.prompt_tokens ?? 0
  const outputTokens = data.usage?.completion_tokens ?? 0
  const tokensUsed = data.usage?.total_tokens ?? (inputTokens + outputTokens)

  return { content, tokensUsed, inputTokens, outputTokens, rawResponse: data }
}

// ---- Router ----
export async function callAiProvider(opts: AiRequestOptions): Promise<AiResponse> {
  switch (opts.provider) {
    case 'google':
      return callGemini(opts)
    case 'anthropic':
      return callClaude(opts)
    case 'groq':
      return callGroq(opts)
    default:
      throw new Error(`Unsupported AI provider: ${opts.provider}`)
  }
}

// ---- Prompt template interpolation ----
// Replaces {{variable}} placeholders in prompt templates with values from context.
export function interpolatePrompt(template: string, context: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] ?? `{{${key}}}`)
}

// ---- Cost estimation (approximate, USD) ----
// Used for accurate logging & margin analysis.
export interface TokenRate {
  inputPer1k: number
  outputPer1k: number
}

// Pricing benchmark rates per 1,000 tokens (USD)
const MODEL_TOKEN_RATES: Record<string, TokenRate> = {
  'gemini-3.6-flash':              { inputPer1k: 0.0001,   outputPer1k: 0.0004 },
  'gemini-3.5-flash':              { inputPer1k: 0.0001,   outputPer1k: 0.0004 },
  'gemini-2.5-flash':              { inputPer1k: 0.0001,   outputPer1k: 0.0004 },
  'gemini-2.0-flash':              { inputPer1k: 0.000075, outputPer1k: 0.0003 },
  'claude-sonnet-4-6':             { inputPer1k: 0.003,    outputPer1k: 0.015 },
  'claude-sonnet-4-5':             { inputPer1k: 0.003,    outputPer1k: 0.015 },
  'claude-sonnet-4-5-20250514':    { inputPer1k: 0.003,    outputPer1k: 0.015 },
  'claude-3-5-sonnet-20241022':    { inputPer1k: 0.003,    outputPer1k: 0.015 },
  'claude-haiku-3-5':              { inputPer1k: 0.0008,   outputPer1k: 0.004 },
  'claude-3-5-haiku-20241022':     { inputPer1k: 0.0008,   outputPer1k: 0.004 },
  'gpt-4o-mini':                   { inputPer1k: 0.00015,  outputPer1k: 0.0006 },
  'gpt-4o':                        { inputPer1k: 0.0025,   outputPer1k: 0.010 },
  'llama-3.3-70b-versatile':       { inputPer1k: 0.00059,  outputPer1k: 0.00079 },
  'llama-3.1-8b-instant':          { inputPer1k: 0.00005,  outputPer1k: 0.00008 },
  'deepseek-r1-distill-llama-70b': { inputPer1k: 0.00075,  outputPer1k: 0.00099 },
  'mixtral-8x7b-32768':            { inputPer1k: 0.00024,  outputPer1k: 0.00024 },
  'qwen/qwen3.8-27b':              { inputPer1k: 0.00020,  outputPer1k: 0.00020 },
}

const BLENDED_FALLBACK_PER_1K: Record<string, number> = {
  'gemini-3.6-flash':              0.00025,
  'gemini-3.5-flash':              0.00025,
  'gemini-2.5-flash':              0.00025,
  'gemini-2.0-flash':              0.00015,
  'claude-sonnet-4-6':             0.009,
  'claude-sonnet-4-5':             0.009,
  'claude-sonnet-4-5-20250514':    0.009,
  'claude-3-5-sonnet-20241022':    0.009,
  'claude-haiku-3-5':              0.0024,
  'claude-3-5-haiku-20241022':     0.0024,
  'gpt-4o-mini':                   0.000375,
  'gpt-4o':                        0.00625,
  'llama-3.3-70b-versatile':       0.00069,
  'llama-3.1-8b-instant':          0.000065,
  'deepseek-r1-distill-llama-70b': 0.00087,
  'mixtral-8x7b-32768':            0.00024,
  'qwen/qwen3.8-27b':              0.0002,
}

export function estimateCostUsd(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  totalTokensFallback?: number
): number {
  const rate = MODEL_TOKEN_RATES[modelName]
  if (rate) {
    return (inputTokens / 1000) * rate.inputPer1k + (outputTokens / 1000) * rate.outputPer1k
  }
  const blendedRate = BLENDED_FALLBACK_PER_1K[modelName] ?? 0.0005
  const total = totalTokensFallback ?? (inputTokens + outputTokens)
  return (total / 1000) * blendedRate
}
