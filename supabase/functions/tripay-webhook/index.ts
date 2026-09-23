import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'

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

    const amountReceived = Number(payload.total_amount ?? payload.amount_received ?? payload.amount ?? 0)

    // ---- Atomic State Transition & Subscription Entitlement via Stored Procedure ----
    const { data: result, error: rpcErr } = await supabase.rpc('process_tripay_payment', {
      p_merchant_ref: merchant_ref,
      p_tripay_reference: reference ?? null,
      p_amount_received: amountReceived,
    })

    if (rpcErr || !result?.success) {
      console.error('[tripay-webhook] Payment processing failed:', rpcErr || result)
      return new Response(JSON.stringify({ 
        success: false, 
        code: result?.code || 'PROCESSING_ERROR',
        message: result?.message || 'Payment processing failed' 
      }), { status: 400 })
    }

    console.log(`[tripay-webhook] Result for ${merchant_ref}: ${result.code} - ${result.message}`)
    return new Response(JSON.stringify({ success: true, code: result.code }), { status: 200 })
  } catch (err) {
    console.error('[tripay-webhook] Error:', err)
    return new Response(JSON.stringify({ success: false, message: 'Internal error' }), { status: 500 })
  }
})
