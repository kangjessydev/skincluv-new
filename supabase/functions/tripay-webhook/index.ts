import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  // Tripay sends webhook as POST — no CORS needed but we handle preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const privateKey = Deno.env.get('TRIPAY_PRIVATE_KEY')
    if (!privateKey) return new Response('Not configured', { status: 503 })

    const rawBody = await req.text()
    const callbackSignature = req.headers.get('X-Callback-Signature') ?? ''

    // ---- Verify Webhook Signature ----
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(privateKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (expectedSig !== callbackSignature) {
      console.warn('[tripay-webhook] Invalid signature')
      return new Response(JSON.stringify({ success: false, message: 'Invalid signature' }), { status: 400 })
    }

    const payload = JSON.parse(rawBody)
    const { merchant_ref, reference, status } = payload

    if (status !== 'PAID') {
      // Tripay sends UNPAID, FAILED, REFUND — we only care about PAID
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ---- Update Invoice Status ----
    const { data: invoice, error: invErr } = await supabase
      .from('tripay_invoices')
      .update({ status: 'PAID' })
      .or(`reference.eq.${reference},merchant_ref.eq.${merchant_ref}`)
      .select('user_id, plan')
      .maybeSingle()

    if (invErr || !invoice) {
      console.error('[tripay-webhook] Invoice not found:', reference, merchant_ref, invErr)
      return new Response(JSON.stringify({ success: false, message: 'Invoice not found' }), { status: 404 })
    }

    // ---- Activate Subscription ----
    // Find the subscription tier for the plan
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('id')
      .eq('slug', invoice.plan.toLowerCase())
      .single()

    if (tier) {
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      // Update existing subscription for user_id to Premium tier ID
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', invoice.user_id)
        .maybeSingle()

      if (existingSub) {
        await supabase
          .from('subscriptions')
          .update({
            tier_id: tier.id,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: periodEnd.toISOString(),
            quota_reset_at: periodEnd.toISOString()
          })
          .eq('id', existingSub.id)
      } else {
        await supabase.from('subscriptions').insert({
          user_id: invoice.user_id,
          tier_id: tier.id,
          status: 'active',
          started_at: now.toISOString(),
          expires_at: periodEnd.toISOString(),
          quota_reset_at: periodEnd.toISOString()
        })
      }

      console.log(`[tripay-webhook] Subscription activated for user ${invoice.user_id}`)
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error('[tripay-webhook] Error:', err)
    return new Response(JSON.stringify({ success: false, message: 'Internal error' }), { status: 500 })
  }
})
