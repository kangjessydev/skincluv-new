import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

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
    const { secret_name, secret_value } = body as { secret_name?: string; secret_value?: string }

    if (!secret_name || !secret_value || typeof secret_name !== 'string' || typeof secret_value !== 'string') {
      return jsonError('secret_name dan secret_value wajib diisi', 400)
    }

    // Write to Vault via public.set_vault_secret using service_role client
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

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
    return jsonError(err?.message || 'Gagal menyimpan API key', 500)
  }
})

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}
