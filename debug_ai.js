import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gapctakvmorjafqxaqjk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcGN0YWt2bW9yamFmcXhhcWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNTE3OTcsImV4cCI6MjEwMTgyNzc5N30.kbO0M_ROL1YH-lZCFklEVDaCiuujbpAepp5KwqdKsis'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('Logging in/Signing up...')
  const email = `jessy.skincluv+${Date.now()}@gmail.com`
  const password = 'password123'
  
  const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password })
  if (authErr) {
    console.error('Signup error:', authErr)
    return
  }
  
  let token = authData?.session?.access_token
  
  console.log('Calling invoke-ai...')
  const res = await fetch(`${supabaseUrl}/functions/v1/invoke-ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      feature_slug: 'chatbot',
      messages: [{ role: 'user', content: 'hello' }]
    })
  })
  
  const text = await res.text()
  console.log('Status:', res.status)
  console.log('Response:', text)

  console.log('Fetching logs for this user...')
  const { data: logs, error: logErr } = await supabase
    .from('ai_request_logs')
    .select('status, input_summary, raw_output, latency_ms')
    .order('created_at', { ascending: false })
    .limit(5)
    
  console.log('Logs:', JSON.stringify(logs, null, 2))
}

test()

