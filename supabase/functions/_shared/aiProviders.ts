// _shared/aiProviders.ts
// Unified AI provider router — supports Google Gemini and Anthropic Claude.
// Provider and model are resolved at runtime from model_configs table.

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string | Array<{ type: string; [key: string]: unknown }>
}

export interface AiRequestOptions {
  provider: 'google' | 'anthropic' | 'openai'
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

  // Build contents array: system instruction + conversation
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: Array.isArray(m.content)
      ? m.content
      : [{ text: m.content as string }],
  }))

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: parameters?.temperature ?? 0.7,
      maxOutputTokens: parameters?.max_tokens ?? 1024,
    },
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

// ---- Router ----
export async function callAiProvider(opts: AiRequestOptions): Promise<AiResponse> {
  switch (opts.provider) {
    case 'google':
      return callGemini(opts)
    case 'anthropic':
      return callClaude(opts)
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
  'gemini-2.0-flash':        0.000075,
  'gemini-2.5-flash':        0.00015,
  'claude-sonnet-4-5':       0.003,
  'claude-haiku-3-5':        0.00025,
  'gpt-4o-mini':             0.00015,
}

export function estimateCostUsd(modelName: string, tokensUsed: number): number {
  const rate = COST_PER_1K_TOKENS[modelName] ?? 0.001
  return (tokensUsed / 1000) * rate
}
