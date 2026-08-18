import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonError('Unauthorized', 401)

    // User client
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) return jsonError('Unauthorized', 401)

    const body = await req.json()
    const { plan } = body

    if (plan !== 'PREMIUM') {
      return jsonError('Invalid subscription plan', 400)
    }

    const amountIdr = 49000
    const invoiceId = `inv_${crypto.randomUUID()}`

    // Call Xendit API
    const xenditKey = Deno.env.get('XENDIT_SECRET_KEY')
    if (!xenditKey) return jsonError('Payment gateway not configured', 503)

    const authBase64 = btoa(`${xenditKey}:`)
    
    // We get the origin from the request to redirect back
    const origin = req.headers.get('origin') ?? 'http://localhost:5173'

    const xenditRes = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authBase64}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        external_id: invoiceId,
        amount: amountIdr,
        description: `Upgrade Paket Skincluv PRO`,
        success_redirect_url: `${origin}/wallet?success=true`,
        failure_redirect_url: `${origin}/wallet?success=false`,
        customer: {
          email: user.email
        }
      })
    })

    if (!xenditRes.ok) {
      const errBody = await xenditRes.text()
      console.error('Xendit Error:', errBody)
      return jsonError('Failed to create payment invoice', 502)
    }

    const xenditData = await xenditRes.json()

    // Service client for DB insert
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // We store the invoice mapped to a plan instead of coin_amount.
    // We can reuse xendit_invoices table, and just set coin_amount = 0 (since it's a sub)
    // Or we could create a new table, but let's just reuse it.
    await supabaseService.from('xendit_invoices').insert({
      id: xenditData.id, 
      user_id: user.id,
      amount_idr: amountIdr,
      coin_amount: 0, // 0 signifies subscription upgrade
      status: 'PENDING',
      invoice_url: xenditData.invoice_url
    })

    return new Response(
      JSON.stringify({ success: true, invoice_url: xenditData.invoice_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    console.error('Error creating invoice:', err)
    return jsonError('Internal server error', 500)
  }
})

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  )
}
