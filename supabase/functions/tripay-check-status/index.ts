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

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Look up DB record first by reference OR merchant_ref
    let query = supabaseService.from('tripay_invoices').select('*').eq('user_id', user.id)
    if (reference && merchant_ref) {
      query = query.or(`reference.eq.${reference},merchant_ref.eq.${merchant_ref}`)
    } else {
      const refToFind = reference || merchant_ref
      query = query.or(`reference.eq.${refToFind},merchant_ref.eq.${refToFind}`)
    }

    const { data: invoice } = await query.maybeSingle()

    if (!invoice) {
      return jsonError('Invoice not found in system', 404)
    }

    // 2. Query Tripay API for transaction detail (Tripay expects its own reference DEV-T...)
    const tripayRef = invoice.reference || reference || merchant_ref
    let tripayStatus = invoice.status || 'UNPAID'
    let transactionData = null

    if (tripayRef) {
      try {
        const tripayRes = await fetch(`${baseUrl}/transaction/detail?reference=${tripayRef}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        })

        if (tripayRes.ok) {
          const resJson = await tripayRes.json()
          if (resJson.success && resJson.data) {
            transactionData = resJson.data
            tripayStatus = transactionData.status // 'PAID', 'UNPAID', 'EXPIRED', 'FAILED'
          }
        }
      } catch (fetchErr) {
        console.warn('[tripay-check-status] Tripay API fetch notice:', fetchErr)
      }
    }

    // 3. If Tripay reports PAID, but DB is still UNPAID, trigger settlement via atomic Stored Procedure!
    if (tripayStatus === 'PAID' && invoice.status !== 'PAID') {
      const amountReceived = Number(
        transactionData?.total_amount || 
        transactionData?.amount || 
        invoice.total_amount_idr || 
        invoice.amount_idr
      )

      const { data: rpcResult, error: rpcErr } = await supabaseService.rpc('process_tripay_payment', {
        p_merchant_ref: invoice.merchant_ref,
        p_tripay_reference: transactionData?.reference || invoice.reference || null,
        p_amount_received: amountReceived,
      })

      if (rpcErr || !rpcResult?.success) {
        console.warn('[tripay-check-status] Fallback settlement notice:', rpcErr || rpcResult)
      } else {
        console.log('[tripay-check-status] Fallback settlement processed:', rpcResult)
        invoice.status = 'PAID'
      }
    }

    const currentStatus = (tripayStatus === 'PAID' || invoice.status === 'PAID') ? 'PAID' : invoice.status

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
