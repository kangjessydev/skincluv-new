import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonError('Unauthorized', 401)

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) return jsonError('Unauthorized', 401)

    const body = await req.json()
    const { reference, merchant_ref } = body

    if (!reference && !merchant_ref) {
      return jsonError('Missing reference or merchant_ref', 400)
    }

    const apiKey = Deno.env.get('TRIPAY_API_KEY')
    const isSandbox = Deno.env.get('TRIPAY_SANDBOX') !== 'false'
    const baseUrl = isSandbox
      ? 'https://tripay.co.id/api-sandbox'
      : 'https://tripay.co.id/api'

    if (!apiKey) return jsonError('Payment gateway not configured', 503)

    const targetRef = reference || merchant_ref

    // Query Tripay API for transaction detail
    const tripayRes = await fetch(`${baseUrl}/transaction/detail?reference=${targetRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let tripayStatus = 'UNPAID'
    let transactionData = null

    if (tripayRes.ok) {
      const resJson = await tripayRes.json()
      if (resJson.success && resJson.data) {
        transactionData = resJson.data
        tripayStatus = transactionData.status // 'PAID', 'UNPAID', 'EXPIRED', 'FAILED'
      }
    }

    // Check DB record
    let query = supabaseService.from('tripay_invoices').select('*').eq('user_id', user.id)
    if (reference) {
      query = query.or(`reference.eq.${reference},merchant_ref.eq.${reference}`)
    } else {
      query = query.eq('merchant_ref', merchant_ref)
    }

    const { data: invoice } = await query.maybeSingle()

    if (!invoice) {
      return jsonError('Invoice not found in system', 404)
    }

    // If Tripay reports PAID, but DB is still UNPAID, trigger auto-activation!
    if (tripayStatus === 'PAID' && invoice.status !== 'PAID') {
      await supabaseService
        .from('tripay_invoices')
        .update({ status: 'PAID' })
        .eq('id', invoice.id)

      // Activate subscription
      const { data: tier } = await supabaseService
        .from('subscription_tiers')
        .select('id')
        .eq('slug', invoice.plan.toLowerCase())
        .single()

      if (tier) {
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + 1)

        // Update existing subscription for user_id to Premium tier ID
        const { data: existingSub } = await supabaseService
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (existingSub) {
          await supabaseService
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
          await supabaseService.from('subscriptions').insert({
            user_id: user.id,
            tier_id: tier.id,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: periodEnd.toISOString(),
            quota_reset_at: periodEnd.toISOString()
          })
        }
      }
    }

    const currentStatus = tripayStatus === 'PAID' ? 'PAID' : invoice.status

    return new Response(
      JSON.stringify({
        success: true,
        status: currentStatus,
        is_paid: currentStatus === 'PAID',
        invoice: {
          ...invoice,
          status: currentStatus
        },
        tripay_detail: transactionData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err: any) {
    console.error('tripay-check-status error:', err)
    return jsonError(`Internal error: ${err?.message || String(err)}`, 500)
  }
})

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  )
}
