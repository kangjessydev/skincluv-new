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
  rawResponse: unknown
}

// ---- Google Gemini ----
async function callGemini(opts: AiRequestOptions): Promise<AiResponse> {
  const { modelName, apiKey, systemPrompt, messages, parameters } = opts

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

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig,
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const tokensUsed =
    (data.usageMetadata?.promptTokenCount ?? 0) +
    (data.usageMetadata?.candidatesTokenCount ?? 0)

  return { content, tokensUsed, rawResponse: data }
}

// ---- Anthropic Claude ----
async function callClaude(opts: AiRequestOptions): Promise<AiResponse> {
  const { modelName, apiKey, systemPrompt, messages, parameters } = opts

  const body = {
    model: modelName,
    max_tokens: parameters?.max_tokens ?? 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature: parameters?.temperature ?? 0.7,
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const content = data.content?.[0]?.text ?? ''
  const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)

  return { content, tokensUsed, rawResponse: data }
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
  const tokensUsed = data.usage?.total_tokens ?? 0

  return { content, tokensUsed, rawResponse: data }
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
// Used for logging — not billing. Update rates periodically.
const COST_PER_1K_TOKENS: Record<string, number> = {
  'gemini-2.0-flash':             0.000075,
  'gemini-2.5-flash':             0.00015,
  'claude-sonnet-4-5':            0.003,
  'claude-haiku-3-5':             0.00025,
  'claude-3-5-sonnet-20241022':   0.003,
  'claude-3-5-haiku-20241022':    0.0008,
  'gpt-4o-mini':                  0.00015,
  'gpt-4o':                       0.0025,
  'llama-3.3-70b-versatile':      0.00059,
  'llama-3.1-8b-instant':         0.00008,
  'deepseek-r1-distill-llama-70b': 0.00075,
  'mixtral-8x7b-32768':           0.00024,
  'qwen/qwen3.8-27b':             0.0002,
}

export function estimateCostUsd(modelName: string, tokensUsed: number): number {
  const rate = COST_PER_1K_TOKENS[modelName] ?? 0.001
  return (tokensUsed / 1000) * rate
}
