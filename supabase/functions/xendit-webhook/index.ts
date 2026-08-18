import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // Webhooks are usually POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Optional: Verify Xendit Webhook Verification Token
  const xenditToken = req.headers.get('x-callback-token')
  const expectedToken = Deno.env.get('XENDIT_WEBHOOK_TOKEN')
  if (expectedToken && xenditToken !== expectedToken) {
    return new Response('Unauthorized webhook token', { status: 401 })
  }

  try {
    const body = await req.json()
    const { id: invoiceId, status } = body

    if (!invoiceId) {
      return new Response('Bad Request', { status: 400 })
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Update our invoice record
    const { data: invoice, error } = await supabaseService
      .from('xendit_invoices')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error || !invoice) {
      console.error('Invoice not found or error:', error)
      return new Response('Invoice not found', { status: 404 })
    }

    // If paid
    if (status === 'PAID' || status === 'SETTLED') {
      if (invoice.coin_amount === 0) {
        // This is a PRO subscription upgrade!
        
        // 1. Get the Premium tier ID
        const { data: premiumTier } = await supabaseService
          .from('subscription_tiers')
          .select('id')
          .eq('slug', 'premium')
          .single()
          
        if (premiumTier) {
          // 2. Update user's subscription
          await supabaseService
            .from('subscriptions')
            .update({
              tier_id: premiumTier.id,
              quota_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('user_id', invoice.user_id)
            .eq('status', 'active')
            
          // Note: If we wanted to track multiple subscriptions, we might do it differently, 
          // but for MVP updating the active one is perfect.
        }
      } else {
        // Original logic for coins
        const refId = crypto.randomUUID()
        const { data: coinOk } = await supabaseService.rpc('deduct_coins', {
          p_user_id: invoice.user_id,
          p_amount: -invoice.coin_amount,
          p_reference_id: refId
        })
        
        if (coinOk) {
          await supabaseService.from('coin_transactions').insert({
            user_id: invoice.user_id,
            amount: invoice.coin_amount,
            type: 'admin_adjustment',
            reference_id: refId,
            notes: `Top up via Xendit (${invoice.id})`
          })
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (err) {
    console.error('Webhook Error:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
})
