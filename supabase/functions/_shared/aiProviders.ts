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

// ---- Google Gemini ----
async function callGemini(opts: AiRequestOptions): Promise<AiResponse> {
  const { apiKey, systemPrompt, messages, parameters } = opts
  
  // Model failover list: if primary model is 3.6-flash, fallback to gemini-2.0-flash on 503/429
  const candidateModels = [opts.modelName]
  if (opts.modelName.includes('3.6') && !candidateModels.includes('gemini-2.0-flash')) {
    candidateModels.push('gemini-2.0-flash')
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

  const generationConfig: Record<string, any> = {
    temperature: parameters?.temperature ?? 0.2,
    maxOutputTokens: parameters?.max_tokens ?? 2500,
  }

  // Only send thinkingConfig if thinking_budget is explicitly configured in parameters.
  // Never default to 0; if unset, allow Gemini to use its native default reasoning.
  if (parameters?.thinking_budget !== undefined && parameters?.thinking_budget !== null) {
    generationConfig.thinkingConfig = {
      thinkingBudget: Number(parameters.thinking_budget),
    }
  }

  // Native Structured JSON (responseMimeType: "application/json")
  const responseMimeType = parameters?.response_mime_type || parameters?.responseMimeType
  if (responseMimeType) {
    generationConfig.responseMimeType = String(responseMimeType)
  }

  const responseSchema = parameters?.response_schema || parameters?.responseSchema
  if (responseSchema) {
    generationConfig.responseSchema = responseSchema
  }

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig,
  }

  let lastStatus = 0
  let lastErr = ''

  for (const currentModel of candidateModels) {
    // Retry up to 2 attempts per candidate model for transient 503 or 429
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1200))
      }

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        )

        if (!res.ok) {
          lastStatus = res.status
          lastErr = await res.text()
          console.warn(`[callGemini] Model ${currentModel} returned ${res.status}: ${lastErr.slice(0, 150)}`)
          // If transient error (503 High Demand or 429 Rate Limit), retry or switch to fallback model
          if (res.status === 503 || res.status === 429) {
            continue
          }
          throw new Error(`Gemini API error ${res.status}: ${lastErr}`)
        }

        const data = await res.json()
        const parts: any[] = data.candidates?.[0]?.content?.parts ?? []
        // Concatenate all text parts (Gemini splits large outputs across multiple parts)
        const content = parts
          .filter((p: any) => typeof p.text === 'string')
          .map((p: any) => p.text)
          .join('')

        if (!content) {
          throw new Error(`Gemini returned empty content. Raw: ${JSON.stringify(data).slice(0, 400)}`)
        }

        const inputTokens = data.usageMetadata?.promptTokenCount ?? 0
        const outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0
        const thoughtsTokens = data.usageMetadata?.thoughtsTokenCount ?? 0
        const tokensUsed = inputTokens + outputTokens
        console.log(`[callGemini] [TELEMETRY] model=${currentModel} inputTokens=${inputTokens} outputTokens=${outputTokens} thoughtsTokens=${thoughtsTokens} totalTokens=${tokensUsed}`)

        return { content, tokensUsed, inputTokens, outputTokens, rawResponse: data }
      } catch (err: any) {
        // If it's a non-503/429 error, rethrow immediately
        if (lastStatus !== 503 && lastStatus !== 429) {
          throw err
        }
      }
    }
  }

  throw new Error(`Gemini API error ${lastStatus || 503}: ${lastErr || 'Model overloaded. All retry and fallback attempts failed.'}`)
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
