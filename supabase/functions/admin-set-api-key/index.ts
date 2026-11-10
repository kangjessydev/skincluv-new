import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { callAiProvider, estimateCostUsd } from '../_shared/aiProviders.ts'

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonError('Unauthorized: missing auth header', 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify session using user's token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser()
    if (userErr || !userData?.user) {
      return jsonError('Unauthorized: invalid session', 401)
    }

    // Verify admin role via is_admin() RPC
    const { data: isAdmin, error: adminCheckErr } = await supabaseAuth.rpc('is_admin')
    if (adminCheckErr || !isAdmin) {
      return jsonError('Forbidden: admin only', 403)
    }

    const body = await req.json()
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    // Action: TEST CONNECTION (End-to-End AI model check)
    if (body.action === 'test_connection') {
      const { provider, model_name, secret_name, secret_value } = body as {
        provider?: 'google' | 'anthropic' | 'openai' | 'groq'
        model_name?: string
        secret_name?: string
        secret_value?: string
      }

      if (!provider || !model_name || !secret_name) {
        return jsonError('provider, model_name, dan secret_name wajib diisi untuk pengetesan.', 400)
      }

      // Resolve API key
      let resolvedApiKey = secret_value?.trim() || ''
      if (!resolvedApiKey) {
        const { data: vaultKey, error: vaultErr } = await supabaseService.rpc('get_decrypted_secret', {
          secret_name: secret_name.trim(),
        })
        if (vaultErr || !vaultKey) {
          return jsonError(`API Key "${secret_name}" tidak ditemukan di Supabase Vault. Simpan API key terlebih dahulu.`, 404)
        }
        resolvedApiKey = vaultKey as string
      }

      // Execute ping
      const startTime = performance.now()
      try {
        const aiResponse = await callAiProvider({
          provider,
          modelName: model_name.trim(),
          apiKey: resolvedApiKey,
          systemPrompt: 'Kamu adalah model AI sistem. Jawab hanya dengan 1 kalimat singkat bahwa kamu aktif dan siap.',
          messages: [{ role: 'user', content: 'Tes koneksi sistem Skincluv. Konfirmasi status kamu.' }],
          parameters: {
            thinking_budget: 0,
            max_tokens: 60,
            temperature: 0.2,
          },
        })
        const latencyMs = Math.round(performance.now() - startTime)

        // Log test connection token consumption to ai_request_logs so provider_balances stays in sync with AI Studio
        try {
          const { data: cfg } = await supabaseService
            .from('model_configs')
            .select('id, feature_id')
            .eq('provider', provider)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle()

          if (cfg?.id && cfg?.feature_id) {
            const { data: pv } = await supabaseService
              .from('prompt_versions')
              .select('id')
              .eq('feature_id', cfg.feature_id)
              .eq('is_active', true)
              .limit(1)
              .maybeSingle()

            if (pv?.id) {
              const actualModel = aiResponse.modelUsed || model_name.trim()
              const costUsd = estimateCostUsd(
                actualModel,
                aiResponse.inputTokens,
                aiResponse.outputTokens,
                aiResponse.tokensUsed
              )
              await supabaseService.from('ai_request_logs').insert({
                user_id: userData.user.id,
                feature_id: cfg.feature_id,
                prompt_version_id: pv.id,
                model_config_id: cfg.id,
                provider_id: provider,
                input_summary: '[ADMIN:test_connection] Ping model status',
                output_summary: aiResponse.content.trim().slice(0, 300),
                raw_output: aiResponse.rawResponse ?? {},
                tokens_used: aiResponse.tokensUsed,
                input_tokens: aiResponse.inputTokens,
                output_tokens: aiResponse.outputTokens,
                latency_ms: latencyMs,
                cost_usd: costUsd,
                status: 'success',
              })
            }
          }
        } catch (logErr) {
          console.warn('[admin-set-api-key] Warning logging test_connection:', logErr)
        }

        return new Response(
          JSON.stringify({
            success: true,
            latency_ms: latencyMs,
            output: aiResponse.content.trim(),
            tokens_used: aiResponse.tokensUsed,
            provider,
            model_name: model_name.trim(),
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } catch (callErr: any) {
        const latencyMs = Math.round(performance.now() - startTime)
        return jsonError(`Gagal menghubungi model "${model_name}" via ${provider} (${latencyMs}ms): ${callErr.message}`, 502)
      }
    }

    // Default Action: SET VAULT SECRET
    const { secret_name, secret_value } = body as { secret_name?: string; secret_value?: string }

    if (!secret_name || !secret_value || typeof secret_name !== 'string' || typeof secret_value !== 'string') {
      return jsonError('secret_name dan secret_value wajib diisi', 400)
    }

    // Write to Vault via public.set_vault_secret using service_role client
    const { data: secretId, error: vaultErr } = await supabaseService.rpc('set_vault_secret', {
      secret_name: secret_name.trim(),
      secret_value: secret_value.trim(),
      secret_description: 'Managed by Admin Panel',
    })

    if (vaultErr) {
      console.error('[admin-set-api-key] Vault RPC error:', vaultErr)
      return jsonError(`Gagal menyimpan ke Vault: ${vaultErr.message}`, 500)
    }

    return new Response(JSON.stringify({ success: true, secret_id: secretId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    console.error('[admin-set-api-key] Error:', err)
    return jsonError(err?.message || 'Terjadi kesalahan sistem internal', 500)
  }
})

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}
