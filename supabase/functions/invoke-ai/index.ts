// supabase/functions/invoke-ai/index.ts
//
// Generic AI invocation handler for all Skincluv AI features.
//
// Flow:
//  1. Auth guard
//  2. Load feature config (prompt, model, quota)
//  3. Rate limiting (10 req/min per user per feature)
//  4. Quota / coin check
//  5. Atomic deduction (Postgres function)
//  6. Call AI provider (with rollback on error — Opsi A)
//  7. Log result
//  8. Return response

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { callAiProvider, interpolatePrompt, estimateCostUsd } from '../_shared/aiProviders.ts'

const RATE_LIMIT_WINDOW_MS = 60 * 1000   // 1 minute
const RATE_LIMIT_MAX       = 10          // max requests per window
// Cost in coins per feature (when quota is exhausted)
const COIN_COST_PER_FEATURE: Record<string, number> = {
  face_validation: 2,
  face_analysis:   10,
  ingredient_scan: 5,
  chatbot:         1,
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // ---- 1. Auth Guard ----
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonError('Unauthorized', 401)
    }

    // Service client — bypasses RLS for internal operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    // User client — for auth verification
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return jsonError('Unauthorized', 401)
    }

    // ---- 2. Parse request body ----
    const body = await req.json()
    const { feature_slug, messages, input_context, use_coins } = body as {
      feature_slug: string
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      input_context?: Record<string, string>
      use_coins?: boolean
    }

    if (!feature_slug || !messages?.length) {
      return jsonError('Missing required fields: feature_slug, messages', 400)
    }

    // Truncate message history to last 6 messages to keep latency low & prevent gateway timeouts
    const trimmedMessages = messages.slice(-6)

    // ---- 3. Load feature + prompt + model config (in parallel) ----
    const [featureRes, subscriptionRes] = await Promise.all([
      supabaseService
        .from('ai_features')
        .select('id, slug, is_active')
        .eq('slug', feature_slug)
        .single(),
      supabaseService
        .from('subscriptions')
        .select('id, tier_id, quota_reset_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
    ])

    if (featureRes.error || !featureRes.data?.is_active) {
      return jsonError('Feature not found or inactive', 404)
    }

    const feature = featureRes.data
    const subscription = subscriptionRes.data

    // Load active prompt + model for this feature
    const [promptRes, modelRes] = await Promise.all([
      supabaseService
        .from('prompt_versions')
        .select('id, system_prompt, user_prompt')
        .eq('feature_id', feature.id)
        .eq('is_active', true)
        .single(),
      supabaseService
        .from('model_configs')
        .select('id, provider, model_name, api_key_secret, parameters')
        .eq('feature_id', feature.id)
        .eq('is_active', true)
        .single(),
    ])

    if (promptRes.error || !promptRes.data) {
      return jsonError('No active prompt configured for this feature', 503)
    }
    if (modelRes.error || !modelRes.data) {
      return jsonError('No active model configured for this feature', 503)
    }

    const prompt = promptRes.data
    const model = modelRes.data

    // ---- 4. Rate Limiting (10 req/min per user per feature) ----
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

    const { count: recentCount } = await supabaseService
      .from('rate_limit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('feature_slug', feature_slug)
      .gte('requested_at', windowStart)

    if ((recentCount ?? 0) >= RATE_LIMIT_MAX) {
      return jsonError('Rate limit exceeded. Please wait before trying again.', 429)
    }

    // Log this request (fire-and-forget)
    supabaseService.from('rate_limit_log').insert({
      user_id: user.id,
      feature_slug,
    }).then(() => {
      // Cleanup old entries (older than 2 minutes) — async, non-blocking
      supabaseService
        .from('rate_limit_log')
        .delete()
        .eq('user_id', user.id)
        .eq('feature_slug', feature_slug)
        .lt('requested_at', new Date(Date.now() - 2 * RATE_LIMIT_WINDOW_MS).toISOString())
        .then(() => {})
    })

    // ---- 5. Quota / Coin Check & Atomic Deduction ----
    let deductMode: 'quota' | 'coin' | null = null
    let deductedFeatureId = feature.id // keep track for rollback

    if (subscription) {
      // Fetch universal feature id
      const { data: univFeature } = await supabaseService
        .from('ai_features')
        .select('id')
        .eq('slug', 'universal_ai')
        .single()

      if (univFeature) {
        // Try quota deduction first against the universal feature
        const { data: quotaOk } = await supabaseService.rpc('deduct_quota', {
          p_user_id: user.id,
          p_feature_id: univFeature.id,
          p_subscription_id: subscription.id,
        })

        if (quotaOk) {
          deductMode = 'quota'
          deductedFeatureId = univFeature.id
        }
      }
    }

    // If quota failed or no subscription, try coins
    if (!deductMode) {
      const coinCost = COIN_COST_PER_FEATURE[feature_slug] ?? 5

      if (!use_coins) {
        return jsonError('Quota exceeded. Enable coin payment or upgrade subscription.', 402)
      }

      // We'll deduct after we confirm the user wants to use coins
      // At this point use_coins=true, so proceed with coin deduction
      // (reference_id will be filled after we generate a log entry placeholder)
      const tempRef = crypto.randomUUID()
      const { data: coinOk } = await supabaseService.rpc('deduct_coins', {
        p_user_id: user.id,
        p_amount: coinCost,
        p_reference_id: tempRef,
      })

      if (!coinOk) {
        return jsonError('Insufficient coins. Complete missions to earn more coins.', 402)
      }
      deductMode = 'coin'
    }

    // ---- 6. Resolve API Key from Supabase Vault ----
    // Use the RPC function created in migration 007
    let apiKey = ''
    try {
      const { data, error: vaultErr } = await supabaseService
        .rpc('get_decrypted_secret', { secret_name: model.api_key_secret })

      if (!vaultErr && data) {
        apiKey = data as string
      }
    } catch {
      // Vault not available — try env var fallback (local dev)
    }

    // Env var fallback for local development
    if (!apiKey) {
      const envKey = `AI_KEY_${model.api_key_secret.toUpperCase()}`
      apiKey = Deno.env.get(envKey) ?? ''
    }

    if (!apiKey) {
      await rollback(supabaseService, user.id, deductedFeatureId, subscription?.id, deductMode, COIN_COST_PER_FEATURE[feature_slug])
      return jsonError('AI provider API key not configured. Check Vault secret name.', 503)
    }

    // ---- 7. Build prompt context ----
    // Fetch active skin profile & user profile for context injection
    const [skinProfileRes, userProfileRes] = await Promise.all([
      supabaseService
        .from('skin_profiles')
        .select('skin_type, skin_concerns, analysis_notes')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle(),
      supabaseService
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    const skinProfile = skinProfileRes.data
    const userProfile = userProfileRes.data
    const userName = userProfile?.full_name?.split(' ')[0] || user.user_metadata?.full_name || 'Bestie'

    const promptContext: Record<string, string> = {
      user_name: userName,
      skin_type: skinProfile?.skin_type ?? 'unknown',
      skin_concerns: skinProfile?.skin_concerns?.join(', ') ?? 'none',
      analysis_notes: skinProfile?.analysis_notes ?? '',
      ...(input_context ?? {}),
    }

    const systemPrompt = interpolatePrompt(prompt.system_prompt, promptContext)

    // ---- 8. Call AI Provider ----
    const startTime = Date.now()
    let aiResult
    let aiError: Error | null = null

    try {
      aiResult = await callAiProvider({
        provider: model.provider as 'google' | 'anthropic',
        modelName: model.model_name,
        apiKey,
        systemPrompt,
        messages: trimmedMessages,
        parameters: model.parameters as Record<string, number>,
      })
    } catch (err) {
      aiError = err as Error
    }

    const latencyMs = Date.now() - startTime

    // ---- Opsi A: Rollback on provider error ----
    if (aiError) {
      await rollback(supabaseService, user.id, deductedFeatureId, subscription?.id, deductMode, COIN_COST_PER_FEATURE[feature_slug])

      // Log failed attempt (no quota/coin consumed)
      await supabaseService.from('ai_request_logs').insert({
        user_id: user.id,
        feature_id: feature.id,
        prompt_version_id: prompt.id,
        model_config_id: model.id,
        input_summary: messages.at(-1)?.content?.slice(0, 200),
        raw_output: { error: aiError.message },
        latency_ms: latencyMs,
        status: 'error',
      })

      return jsonError(`AI provider error: ${aiError.message}`, 502)
    }

    // ---- 9. Log successful result ----
    const costUsd = estimateCostUsd(model.model_name, aiResult!.tokensUsed)

    await supabaseService.from('ai_request_logs').insert({
      user_id: user.id,
      feature_id: feature.id,
      prompt_version_id: prompt.id,
      model_config_id: model.id,
      input_summary: messages.at(-1)?.content?.slice(0, 200),
      output_summary: aiResult!.content.slice(0, 300),
      raw_output: aiResult!.rawResponse,
      tokens_used: aiResult!.tokensUsed,
      latency_ms: latencyMs,
      cost_usd: costUsd,
      status: 'success',
    })

    // ---- 10. Return response ----
    return new Response(
      JSON.stringify({
        success: true,
        content: aiResult!.content,
        deduct_mode: deductMode,
        tokens_used: aiResult!.tokensUsed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    console.error('[invoke-ai] Unhandled error:', err)
    return jsonError('Internal server error', 500)
  }
})

// ---- Helpers ----

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  )
}

async function rollback(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  featureId: string,
  subscriptionId: string | undefined,
  mode: 'quota' | 'coin' | null,
  coinAmount?: number
): Promise<void> {
  if (!mode) return
  try {
    await supabase.rpc('rollback_deduction', {
      p_user_id: userId,
      p_feature_id: featureId,
      p_subscription_id: subscriptionId ?? '00000000-0000-0000-0000-000000000000',
      p_mode: mode,
      p_coin_amount: mode === 'coin' ? (coinAmount ?? 0) : null,
    })
  } catch (err) {
    console.error('[invoke-ai] rollback failed:', err)
  }
}
