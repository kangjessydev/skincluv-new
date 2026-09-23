import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonError('Unauthorized', 401)

    // Verify user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) return jsonError('Unauthorized', 401)

    const body = await req.json()
    const { plan, method } = body

    const normalizedPlan = (plan || 'PREMIUM').toUpperCase()
    if (normalizedPlan !== 'PREMIUM' && normalizedPlan !== 'GLOW') {
      return jsonError('Invalid subscription plan. Must be GLOW or PREMIUM.', 400)
    }

    // ---- Tripay Config ----
    const apiKey      = Deno.env.get('TRIPAY_API_KEY')
    const privateKey  = Deno.env.get('TRIPAY_PRIVATE_KEY')
    const merchantCode = Deno.env.get('TRIPAY_MERCHANT_CODE')
    const isSandbox   = Deno.env.get('TRIPAY_SANDBOX') !== 'false' // default sandbox=true
    const baseUrl     = isSandbox
      ? 'https://tripay.co.id/api-sandbox'
      : 'https://tripay.co.id/api'

    if (!apiKey || !privateKey || !merchantCode) {
      return jsonError('Payment gateway not configured', 503)
    }

    const isGlow = normalizedPlan === 'GLOW'
    const amountIdr   = isGlow ? 25000 : 49000
    const planSku     = isGlow ? 'SKINCLUV-GLOW' : 'SKINCLUV-PRO'
    const planName    = isGlow ? 'Skincluv GLOW — 1 Bulan' : 'Skincluv PRO — 1 Bulan'
    const merchantRef = `INV-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const channel     = method || 'BRIVA' // Default BRIVA if not specified

    // ---- Generate HMAC-SHA256 Signature ----
    // Format: merchantCode + merchantRef + amount
    const signatureStr = `${merchantCode}${merchantRef}${amountIdr}`
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(privateKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signatureStr))
    const signature = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const origin = req.headers.get('origin') ?? 'http://localhost:5173'

    // ---- Create Tripay Transaction ----
    const payload = {
      method: channel,
      merchant_ref: merchantRef,
      amount: amountIdr,
      customer_name: user.email?.split('@')[0] ?? 'Skincluver',
      customer_email: user.email,
      customer_phone: '081234567890',
      order_items: [
        {
          sku: planSku,
          name: planName,
          price: amountIdr,
          quantity: 1,
          product_url: `${origin}`,
          image_url: `${origin}/logo.png`
        }
      ],
      return_url: `${origin}/payment-success?reference=${merchantRef}`,
      expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 jam
      signature
    }

    const tripayRes = await fetch(`${baseUrl}/transaction/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const tripayData = await tripayRes.json()

    if (!tripayRes.ok || !tripayData.success) {
      console.error('Tripay Error:', JSON.stringify(tripayData))
      const msg = tripayData.message || (typeof tripayData === 'string' ? tripayData : JSON.stringify(tripayData))
      return jsonError(`Tripay Error: ${msg}`, 400)
    }

    const transaction = tripayData.data

    // ---- Save to DB ----
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const expiredAt = typeof transaction.expired_time === 'number'
      ? new Date(transaction.expired_time * 1000).toISOString()
      : (transaction.expired_at ?? null)

    await supabaseService.from('tripay_invoices').upsert({
      merchant_ref: merchantRef,
      reference: transaction.reference,
      user_id: user.id,
      amount_idr: amountIdr,
      plan: normalizedPlan,
      status: 'UNPAID',
      checkout_url: transaction.checkout_url ?? null,
      pay_url: transaction.pay_url ?? null,
      qr_url: transaction.qr_url ?? null,
      expired_at: expiredAt
    })

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: transaction.checkout_url,
        reference: transaction.reference,
        merchant_ref: merchantRef,
        pay_code: transaction.pay_code,
        amount: amountIdr
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err: any) {
    console.error('tripay-invoice error:', err)
    return jsonError(`Internal server error: ${err?.message || String(err)}`, 500)
  }
})

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  )
}
