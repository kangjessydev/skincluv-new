import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { data, error } = await supabaseService
    .from('ai_request_logs')
    .select('id, user_id, status, input_summary, raw_output, latency_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
    
  return new Response(JSON.stringify({ data, error }), { 
    headers: { 'Content-Type': 'application/json' } 
  })
})
