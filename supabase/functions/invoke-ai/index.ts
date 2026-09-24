// supabase/functions/invoke-ai/index.ts
//
// Generic AI invocation handler for all Skincluv AI features.
//
// Flow:
//  1. Auth guard
//  2. Load feature config (prompt, model, quota)
//  3. Rate limiting (10 req/min per user per feature)
//  4. Quota / coin check
//  5. Atomic deduction (Postgres function)
//  6. Build context (skin profile, clinical memory, session summaries)
//  7. [Chatbot] Web search pipeline (keyword-triggered, cache-first)
//  8. Call AI provider (with rollback on error — Opsi A)
//  9. Log result
// 10. [Chatbot] Background: session summary generation
// 11. Return response (including sources[] for frontend accordion)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { callAiProvider, interpolatePrompt, estimateCostUsd } from '../_shared/aiProviders.ts'
import {
  needsWebSearch,
  buildSearchQuery,
  fetchSearchResults,
  formatSourcesForPrompt,
  type SearchSource,
} from '../_shared/searchProvider.ts'

const RATE_LIMIT_WINDOW_MS = 60 * 1000   // 1 minute
const RATE_LIMIT_MAX       = 10          // max requests per window
// Cost in Credits per feature (when quota is exhausted or free tier)
const CREDIT_COST_PER_FEATURE: Record<string, number> = {
  face_validation: 0,
  face_analysis:   5,
  ingredient_scan: 3,
  chatbot:         1,
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // ---- 1. Auth Guard ----
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonError('Unauthorized', 401)
    }

    // Service client — bypasses RLS for internal operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    // User client — for auth verification
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return jsonError('Unauthorized', 401)
    }

    // ---- 2. Parse request body ----
    const body = await req.json()
    const { feature_slug, messages, input_context, use_coins, session_id, message_count, idempotency_key } = body as {
      feature_slug: string
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      input_context?: Record<string, string>
      use_coins?: boolean
      session_id?: string       // ID sesi aktif (untuk session summary trigger)
      message_count?: number    // Jumlah pesan dalam sesi ini (frontend kirim)
      idempotency_key?: string  // Client-generated UUID untuk idempotensi finansial
    }

    if (!feature_slug || !messages?.length) {
      return jsonError('Missing required fields: feature_slug, messages', 400)
    }

    // ---- 3. Load feature + prompt + model config (in parallel) ----
    const [featureRes, subscriptionRes] = await Promise.all([
      supabaseService
        .from('ai_features')
        .select('id, slug, is_active, credit_cost')
        .eq('slug', feature_slug)
        .single(),
      supabaseService
        .from('subscriptions')
        .select('id, tier_id, quota_reset_at, subscription_tiers(slug, name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
    ])

    if (featureRes.error || !featureRes.data?.is_active) {
      return jsonError('Feature not found or inactive', 404)
    }

    const feature = featureRes.data
    const subscription = subscriptionRes.data
    const isPro = (subscription as any)?.subscription_tiers?.slug === 'premium'

    // Extended context window: 20 messages (10 turns) for PRO chatbot, 14 messages (7 turns) for standard chatbot, 6 for other features
    const historyLimit = isPro && feature_slug === 'chatbot' ? 20 : (feature_slug === 'chatbot' ? 14 : 6)
    const trimmedMessages = messages.slice(-historyLimit)

    // Load active prompt + model for this feature
    const [promptRes, modelRes] = await Promise.all([
      supabaseService
        .from('prompt_versions')
        .select('id, system_prompt, user_prompt')
        .eq('feature_id', feature.id)
        .eq('is_active', true)
        .single(),
      supabaseService
        .from('model_configs')
        .select('id, provider, model_name, api_key_secret, parameters')
        .eq('feature_id', feature.id)
        .eq('is_active', true)
        .single(),
    ])

    if (promptRes.error || !promptRes.data) {
      return jsonError('No active prompt configured for this feature', 503)
    }
    if (modelRes.error || !modelRes.data) {
      return jsonError('No active model configured for this feature', 503)
    }

    const prompt = promptRes.data
    const model = modelRes.data

    // ---- 4. Rate Limiting (10 req/min per user per feature) ----
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

    const { count: recentCount } = await supabaseService
      .from('rate_limit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('feature_slug', feature_slug)
      .gte('requested_at', windowStart)

    if ((recentCount ?? 0) >= RATE_LIMIT_MAX) {
      return jsonError('Rate limit exceeded. Please wait before trying again.', 429)
    }

    // Log this request (fire-and-forget)
    supabaseService.from('rate_limit_log').insert({
      user_id: user.id,
      feature_slug,
    }).then(() => {
      // Cleanup old entries (older than 2 minutes) — async, non-blocking
      supabaseService
        .from('rate_limit_log')
        .delete()
        .eq('user_id', user.id)
        .eq('feature_slug', feature_slug)
        .lt('requested_at', new Date(Date.now() - 2 * RATE_LIMIT_WINDOW_MS).toISOString())
        .then(() => {})
    })

    // ---- 5. Quota / Coin Check & Atomic Deduction ----
    let deductMode: 'quota' | 'coin' | null = null
    let deductedFeatureId = feature.id // keep track for rollback
    const dynamicCost = (feature as any).credit_cost
    const creditCost = typeof dynamicCost === 'number' && dynamicCost >= 0
      ? dynamicCost
      : (CREDIT_COST_PER_FEATURE[feature_slug] ?? 3)

    // Validasi idempotency key dari client (mencegah double-spending saat retry)
    let operationRef = crypto.randomUUID()
    if (typeof idempotency_key === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idempotency_key)) {
      operationRef = idempotency_key
    }

    // Only deduct quota/credits if feature has cost > 0 (e.g. face_validation is a free validation gate)
    if (creditCost > 0) {
      if (subscription) {
        // Fetch universal feature id
        const { data: univFeature } = await supabaseService
          .from('ai_features')
          .select('id')
          .eq('slug', 'universal_ai')
          .single()

        if (univFeature) {
          // Try quota deduction first against the universal feature
          const { data: quotaOk } = await supabaseService.rpc('deduct_quota', {
            p_user_id: user.id,
            p_feature_id: univFeature.id,
            p_subscription_id: subscription.id,
          })

          if (quotaOk) {
            deductMode = 'quota'
            deductedFeatureId = univFeature.id
          }
        }
      }

      // If quota failed or no subscription, try credits
      if (!deductMode) {
        if (!use_coins) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Quota habis. Silakan gunakan Credits atau upgrade paket.',
              code: 'QUOTA_EXCEEDED',
              credit_cost: creditCost,
              coin_cost: creditCost, // backward compatibility
              feature_slug,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
          )
        }

        // Proceed with credit deduction (using atomic & idempotent deduct_coins function)
        const { data: creditOk, error: deductErr } = await supabaseService.rpc('deduct_coins', {
          p_user_id: user.id,
          p_amount: creditCost,
          p_reference_id: operationRef,
        })

        if (deductErr || !creditOk) {
          return jsonError('Credits tidak mencukupi. Selesaikan misi untuk mendapatkan Credits atau upgrade ke paket Glow/Pro.', 402)
        }
        deductMode = 'coin'
      }
    }

    // ---- 6. Resolve API Key from Supabase Vault ----
    // Use the RPC function created in migration 007
    let apiKey = ''
    try {
      const { data, error: vaultErr } = await supabaseService
        .rpc('get_decrypted_secret', { secret_name: model.api_key_secret })

      if (!vaultErr && data) {
        apiKey = data as string
      }
    } catch {
      // Vault not available — try env var fallback (local dev)
    }

    // Env var fallback for local development
    if (!apiKey) {
      const envKey = `AI_KEY_${model.api_key_secret.toUpperCase()}`
      apiKey = Deno.env.get(envKey) ?? ''
    }

    if (!apiKey) {
      await rollback(supabaseService, user.id, deductedFeatureId, subscription?.id, deductMode, creditCost, operationRef)
      return jsonError('AI provider API key not configured. Check Vault secret name.', 503)
    }

    // ---- 7. Build prompt context & Attach Multimodal Image if present ----
    // Fetch active skin profile, user profile, clinical memories & session summaries for context injection
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const [skinProfileRes, userProfileRes, memoriesRes, sessionSummariesRes] = await Promise.all([
      supabaseService
        .from('skin_profiles')
        .select('skin_type, skin_concerns, analysis_notes')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle(),
      supabaseService
        .from('profiles')
        .select('full_name, chatbot_memory_consent')
        .eq('id', user.id)
        .maybeSingle(),
      supabaseService
        .from('user_clinical_memories')
        .select('memory_type, entity, clinical_fact')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(8),
      // Fetch 5 session summaries terbaru dalam 30 hari (exclude sesi saat ini)
      feature_slug === 'chatbot' && session_id
        ? supabaseService
            .from('chat_session_summaries')
            .select('summary_text, updated_at')
            .eq('user_id', user.id)
            .neq('session_id', session_id)  // exclude sesi aktif sekarang
            .gte('updated_at', thirtyDaysAgo)
            .order('updated_at', { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),
    ])

    const skinProfile = skinProfileRes.data
    const userProfile = userProfileRes.data
    const userName = userProfile?.full_name?.split(' ')[0] || user.user_metadata?.full_name || 'Bestie'

    const promptContext: Record<string, string> = {
      user_name: userName,
      skin_type: skinProfile?.skin_type ?? 'unknown',
      skin_concerns: skinProfile?.skin_concerns?.join(', ') ?? 'none',
      analysis_notes: skinProfile?.analysis_notes ?? '',
      ...(input_context ?? {}),
    }

    let systemPrompt = interpolatePrompt(prompt.system_prompt, promptContext)

    const hasMemoryConsent = userProfile?.chatbot_memory_consent === true

    // Injeksi Memori Klinis Pasien (HANYA jika user sudah memberikan consent untuk chatbot atau untuk keselamatan alergi scan wajah)
    if (feature_slug === 'chatbot' && hasMemoryConsent && memoriesRes.data && memoriesRes.data.length > 0) {
      const memoryLines = memoriesRes.data
        .map((m: any) => `- [${String(m.memory_type).toUpperCase()}]: ${m.entity} (${m.clinical_fact})`)
        .join('\n')
      systemPrompt += `\n\n[MEMORI PASIEN TERVERIFIKASI]:\n${memoryLines}\nGunakan catatan memori di atas untuk mempersonalisasi saran dan secara mutlak menghindari bahan/treatment yang berpotensi memicu reaksi buruk pada pasien.`
    } else if (feature_slug === 'face_analysis' && memoriesRes.data && memoriesRes.data.length > 0) {
      const allergyLines = memoriesRes.data
        .filter((m: any) => ['allergy', 'sensitivity', 'treatment_reaction'].includes(m.memory_type))
        .map((m: any) => `- [${String(m.memory_type).toUpperCase()}]: ${m.entity} (${m.clinical_fact})`)
        .join('\n')
      if (allergyLines) {
        systemPrompt += `\n\n[MEMORI ALERGI & SENSITIVITAS PENGGUNA TERDAFTAR]:\n${allergyLines}\nDILARANG merekomendasikan bahan-bahan di atas atau turunannya dalam daftar Hero Actives (recommended_ingredients).`
      }
    }

    // Injeksi Ringkasan Sesi Sebelumnya untuk Cross-Session Context (HANYA jika consent aktif)
    const sessionSummaries = (sessionSummariesRes as any)?.data ?? []
    if (feature_slug === 'chatbot' && hasMemoryConsent && sessionSummaries.length > 0) {
      const summaryLines = sessionSummaries
        .map((s: any, i: number) => `Sesi ${i + 1}: ${s.summary_text}`)
        .join('\n')
      systemPrompt += `\n\n[KONTEKS PERCAKAPAN SEBELUMNYA]:\n${summaryLines}\nKonteks di atas adalah ringkasan dari topik yang pernah dibahas bersama user pada percakapan/sesi sebelumnya. Jika user menanyakan riwayat obrolan, masalah kulit yang pernah diceritakan, atau topik/produk yang pernah dibahas di sesi sebelumnya, gunakan ringkasan di atas untuk menjawab dan mengonfirmasi secara jelas.`
    }

    // Retrieval bahan aktif terverifikasi (RAG) untuk chatbot
    if (feature_slug === 'chatbot') {
      const lastUserMessage = trimmedMessages.at(-1)?.content
      const messageText = typeof lastUserMessage === 'string' ? lastUserMessage.toLowerCase() : ''

      if (messageText.trim()) {
        const { data: verifiedIngredients } = await supabaseService
          .from('skincare_ingredients')
          .select('canonical_name, aliases, safety_rating, comedogenic_rating, description, incompatible_with')
          .eq('is_verified', true)
          .limit(300)

        const mentioned = (verifiedIngredients ?? []).filter((ing: any) => {
          const names = [ing.canonical_name, ...(ing.aliases ?? [])].filter(Boolean)
          return names.some((n: string) => messageText.includes(n.toLowerCase()))
        })

        if (mentioned.length > 0) {
          const referenceLines = mentioned
            .slice(0, 8)
            .map((ing: any) => {
              const incompatible = ing.incompatible_with?.length
                ? ` | Tidak cocok dicampur dengan: ${ing.incompatible_with.join(', ')}`
                : ''
              return `- ${ing.canonical_name}: safety=${ing.safety_rating}, comedogenic=${ing.comedogenic_rating}/5. ${ing.description ?? ''}${incompatible}`
            })
            .join('\n')
          systemPrompt += `\n\n[REFERENSI BAHAN TERVERIFIKASI SKINCLUV]:\n${referenceLines}\nGunakan data di atas sebagai sumber kebenaran untuk bahan-bahan yang disebut, bukan asumsi dari pengetahuan umum kamu.`
        } else if (messageText.trim()) {
          // Fase 3d: Jika bahan belum ada di verified DB, jadwalkan background enrichment via Gemini
          const words = messageText
            .replace(/[^a-zA-Z0-9\s-]/g, ' ')
            .split(/\s+/)
            .filter(
              (w: string) =>
                w.length >= 3 &&
                ![
                  'apa', 'itu', 'dan', 'sama', 'boleh', 'tidak', 'gak', 'bisa',
                  'bagus', 'buat', 'untuk', 'kulit', 'saya', 'kamu', 'halo',
                  'bagaimana', 'kenapa', 'kapan', 'cara', 'pakai', 'apakah',
                ].includes(w.toLowerCase())
            )
          if (words.length > 0) {
            enrichMissingIngredientsWithGemini(supabaseService, words.slice(0, 2))
              .catch((err) => console.warn('[invoke-ai] Chatbot auto-enrichment warning:', err))
          }
        }
      }
    }

    // Dermatologist Clinical Expert enhancement for PRO tier chatbot
    if (isPro && feature_slug === 'chatbot') {
      systemPrompt += `\n\nKapabilitas tambahan (khusus pelanggan PRO, gunakan HANYA jika relevan dengan pertanyaan user):
- Jika user meminta rekomendasi routine, urutan pemakaian produk, atau analisis kompatibilitas bahan aktif (layering), berikan evaluasi mendalam: kompatibilitas AM/PM, potensi iritasi/over-eksfoliasi, urutan berdasarkan pH & konsistensi, dikaitkan dengan tipe kulit (${promptContext.skin_type}) dan keluhan (${promptContext.skin_concerns}) pengguna.
- ATURAN PENTING: kapabilitas ini TIDAK mengubah aturan panjang jawaban dasar. Sapaan, basa-basi, atau pertanyaan simpel tetap dijawab singkat (1-3 kalimat) — jangan proaktif memberi full routine kalau user tidak memintanya.
- JANGAN PERNAH menyebut, menampilkan, atau mengutip nama mode/instruksi internal ini (termasuk kata "PRO", "dermatologist expert mode", atau label sistem apapun) ke dalam jawaban ke user. Cukup tunjukkan lewat kualitas jawaban, bukan lewat pengumuman.`
    } else if (feature_slug === 'chatbot') {
      systemPrompt += `\n\nMode Respon Konsultasi Standar:
- Berikan panduan yang ramah, ringkas, padat, dan langsung menjawab inti pertanyaan pengguna.
- Hindari pembahasan medis yang bertele-tele agar pengguna mendapatkan rekomendasi yang praktis dan mudah dipahami.`
    }

    // Injeksi Matriks Kontraindikasi Fatal & Kepatuhan BPOM (RFC 004 & RFC 005 Kimi)
    let verifiedInteractions: any[] = []
    if (['ingredient_scan', 'chatbot', 'face_analysis'].includes(feature_slug)) {
      try {
        const [interactionsRes, bannedRes] = await Promise.all([
          supabaseService
            .from('ingredient_interactions')
            .select('ingredient_a, ingredient_b, severity, risk_title, risk_description, clinical_action, bpom_warning')
            .eq('is_verified', true)
            .limit(100),
          supabaseService
            .from('skincare_ingredients')
            .select('canonical_name, aliases, is_drug_only, is_banned_substance, description')
            .or('is_drug_only.eq.true,is_banned_substance.eq.true')
            .limit(100),
        ])

        verifiedInteractions = interactionsRes.data ?? []

        if (interactionsRes.data && interactionsRes.data.length > 0) {
          const interactionLines = interactionsRes.data
            .map((item: any) => `- [${String(item.severity).toUpperCase()}] ${item.ingredient_a} + ${item.ingredient_b}: ${item.risk_title} -> Solusi: ${item.clinical_action}${item.bpom_warning ? ` (Catatan BPOM: ${item.bpom_warning})` : ''}`)
            .join('\n')
          systemPrompt += `\n\n[MATRIKS KONTRAINDIKASI KLINIS TERVERIFIKASI (RFC 004/005 KIMI)]:\nBerikut adalah daftar aturan pasti interaksi bahan aktif klinis. Kamu WAJIB menggunakan data ini jika mendeteksi kombinasi bahan terkait:\n${interactionLines}`
        }

        if (bannedRes.data && bannedRes.data.length > 0) {
          const bannedLines = bannedRes.data
            .map((b: any) => `- ${b.canonical_name} (${(b.aliases ?? []).join(', ')}): ${b.is_banned_substance ? 'ZAT TERLARANG/BERACUN ILEGAL' : 'OBAT KERAS (Wajib resep dokter, dilarang di kosmetik bebas)'}. ${b.description}`)
            .join('\n')
          systemPrompt += `\n\n[DAFTAR ZAT TERLARANG & OBAT KERAS REGULASI BPOM RI]:\nJika formula mengandung zat di bawah ini, kamu WAJIB menandainya sebagai bahaya tinggi/obat keras:\n${bannedLines}`
        }

        if (feature_slug === 'face_analysis') {
          systemPrompt += `\n\n[ATURAN REKOMENDASI BAHAN AKTIF KLINIS (HERO ACTIVES - WAJIB)]:
- DILARANG KERAS merekomendasikan dua bahan dari pasangan kontraindikasi di atas dalam satu sesi rekomendasi.
- Jika evaluasi menunjukkan skin barrier bermasalah/rusak/sensitif (kemerahan, iritasi, peradangan tinggi): HANYA rekomendasikan bahan pemulih barrier (Ceramide, Centella Asiatica, Hyaluronic Acid, Azelaic Acid <=10%, Niacinamide <=5%). DILARANG KERAS merekomendasikan Retinoid, AHA/BHA berkonsentrasi tinggi, atau Vitamin C murni (Ascorbic Acid) sampai barrier pulih.
- Setiap bahan aktif rekomendasi WAJIB relevan dengan kebutuhan perbaikan area wajah pengguna.`
        }

        if (feature_slug === 'ingredient_scan') {
          systemPrompt += `\n\n[ATURAN PENTING PANDUAN KOMBINASI / LAYERING]:
- HANYA masukkan item ke dalam 'danger_combos' jika MINIMAL SALAH SATU atau KEDUA bahan dalam pasangan tersebut BENAR-BENAR TERDAPAT dalam daftar komposisi produk yang dianalisis ini! (Contoh: jika produk mengandung Retinol atau Niacinamide, baru peringatkan interaksinya dengan zat lain).
- DILARANG KERAS memunculkan 'danger_combos' jika kedua bahan sama sekali TIDAK ADA dalam kemasan produk ini (misal: JANGAN memunculkan bahaya AHA/BHA jika produk tidak mengandung zat eksfoliasi).
- Jika formula produk ini aman dan tidak memiliki bahan yang rentan kontraindikasi berat, kosongkan array danger_combos ([]) atau fokuskan pada best_combos saja.
- Pada ingredients_breakdown, untuk setiap bahan berikan nama jelas, peran fungsinya (misal: 'Pelarut pembawa formula', 'Humektan hidrasi', 'Pengental emulsi'), skor komedogenik (0-5), dan status keamanannya.`
        }
      } catch (clinicalErr) {
        console.warn('[invoke-ai] Clinical context fetch skipped:', clinicalErr)
      }
    }

    // Attach image_base64 to the user message for multimodal vision models
    const finalMessages = trimmedMessages.map((m, idx) => {
      if (idx === trimmedMessages.length - 1 && input_context?.image_base64) {
        const textContent = typeof m.content === 'string' ? m.content : ''
        return {
          role: m.role,
          content: [
            { text: textContent },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: input_context.image_base64,
              },
            },
          ],
        }
      }
      return m
    })

    // ---- 8. Web Search Pipeline (keyword-triggered, cache-first, PRO TIER ONLY) ----
    let searchSources: SearchSource[] = []
    if (feature_slug === 'chatbot' && isPro) {
      const lastUserMsg = trimmedMessages.filter((m) => m.role === 'user').at(-1)?.content
      const msgText = typeof lastUserMsg === 'string' ? lastUserMsg : ''
      if (msgText.trim() && needsWebSearch(msgText)) {
        try {
          const searchQuery = buildSearchQuery(msgText, trimmedMessages)
          console.log(`[invoke-ai] Web search query formulated: "${searchQuery}" (from: "${msgText}")`)
          searchSources = await fetchSearchResults(supabaseService, searchQuery)
          if (searchSources.length > 0) {
            systemPrompt += `\n\n[OVERRIDE — REFERENSI KLINIS/WEB TERVERIFIKASI AKTIF]:\nUntuk pertanyaan ini, sistem telah memverifikasi dan mengambilkan referensi web/dermatologi nyata berikut untukmu. ABAIKAN instruksi sebelumnya tentang keterbatasan akses internet — kamu MEMILIKI referensi nyata berikut yang relevan:\n\n${formatSourcesForPrompt(searchSources)}\n\nATURAN WAJIB:\n- Jawab berdasarkan informasi dari referensi di atas secara langsung dan percaya diri\n- Sebutkan [1], [2], atau [3] di dalam jawabanmu saat mengutip informasi dari sumber tersebut\n- JANGAN bilang "saya tidak bisa akses internet" atau "tidak berkaitan" karena referensi ini sudah disaring relevan untuk topik ini\n- JANGAN minta user untuk mencari sendiri — berikan informasinya langsung dari sumber di atas`
          }
        } catch (searchErr) {
          console.warn('[invoke-ai] Web search skipped:', searchErr)
        }
      }
    }

    // ---- 9. Call AI Provider ----
    // Circuit Breaker: Batasi input context maksimal 15.000 token (~60.000 karakter)
    // demi proteksi margin tokenomics (RFC 003 DeepSeek)
    const estimatedInputChars = (systemPrompt?.length ?? 0) + (finalMessages as any[]).reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length : 1000), 0)
    const MAX_ALLOWED_INPUT_CHARS = 60_000 // ~15.000 token
    if (estimatedInputChars > MAX_ALLOWED_INPUT_CHARS) {
      await rollback(supabaseService, user.id, deductedFeatureId, subscription?.id, deductMode, creditCost, operationRef)
      return jsonError('Input konteks atau riwayat chat terlalu panjang (melebihi batas aman 15.000 token). Silakan mulai sesi chat baru.', 400)
    }

    const startTime = Date.now()
    let aiResult
    let aiError: Error | null = null

    // Ensure structured JSON output for analysis features (eliminates markdown wrapping & syntax corruption)
    const isJsonFeature = ['ingredient_scan', 'face_analysis', 'face_validation'].includes(feature_slug)
    const effectiveParameters = {
      ...(model.parameters as Record<string, unknown> ?? {}),
      ...(isJsonFeature && model.provider === 'google' ? { response_mime_type: 'application/json' } : {}),
    }

    try {
      aiResult = await callAiProvider({
        provider: model.provider as 'google' | 'anthropic',
        modelName: model.model_name,
        apiKey,
        systemPrompt,
        messages: finalMessages as any[],
        parameters: effectiveParameters as any,
      })
    } catch (err) {
      aiError = err as Error
    }

    const latencyMs = Date.now() - startTime

    // ---- Opsi A: Rollback on provider error ----
    if (aiError) {
      await rollback(supabaseService, user.id, deductedFeatureId, subscription?.id, deductMode, creditCost, operationRef)

      // Log failed attempt (no quota/coin consumed)
      await supabaseService.from('ai_request_logs').insert({
        user_id: user.id,
        feature_id: feature.id,
        prompt_version_id: prompt.id,
        model_config_id: model.id,
        input_summary: messages.at(-1)?.content?.slice(0, 200),
        raw_output: { error: aiError.message },
        latency_ms: latencyMs,
        status: 'error',
      })

      return jsonError(`AI provider error: ${aiError.message}`, 502)
    }

    // ---- 9. Log successful result ----
    const costUsd = estimateCostUsd(
      model.model_name,
      aiResult!.inputTokens,
      aiResult!.outputTokens,
      aiResult!.tokensUsed
    )

    await supabaseService.from('ai_request_logs').insert({
      user_id: user.id,
      feature_id: feature.id,
      prompt_version_id: prompt.id,
      model_config_id: model.id,
      input_summary: messages.at(-1)?.content?.slice(0, 200),
      output_summary: aiResult!.content.slice(0, 300),
      raw_output: aiResult!.rawResponse,
      tokens_used: aiResult!.tokensUsed,
      input_tokens: aiResult!.inputTokens,
      output_tokens: aiResult!.outputTokens,
      latency_ms: latencyMs,
      cost_usd: costUsd,
      status: 'success',
    })

    // ---- 9b. Track mission progress server-side (Anti-Spoofing & Anti-Abuse Gating) ----
    const MISSION_ACTION_MAP: Record<string, string> = {
      face_analysis: 'face_scan',
      ingredient_scan: 'ingredient_scan',
      chatbot: 'chatbot',
    }
    const missionAction = MISSION_ACTION_MAP[feature_slug]
    if (missionAction) {
      let isEligible = true
      // Gating anti-abuse chatbot: minimal 12 karakter & minimal 2 kata
      if (feature_slug === 'chatbot') {
        const lastUserMsg = trimmedMessages.filter((m) => m.role === 'user').at(-1)?.content
        const msgText = typeof lastUserMsg === 'string' ? lastUserMsg.trim() : ''
        if (msgText.length < 12 || msgText.split(/\s+/).length < 2) {
          isEligible = false
        }
      }

      if (isEligible) {
        supabaseService
          .rpc('record_mission_progress', {
            p_user_id: user.id,
            p_action: missionAction,
            p_count: 1,
            p_reference_id: idempotencyKey || null,
          })
          .then(
            () => {},
            (mErr: unknown) => console.error('[invoke-ai] Error recording mission progress:', mErr)
          )
      }
    }

    // ---- 10. Product Matching Engine (khusus face_analysis) ----
    let finalContent = aiResult!.content

    if (feature_slug === 'face_analysis') {
      const parsed = tryParseAiJson(aiResult!.content)
      if (parsed && parsed.is_valid_face !== false && Array.isArray(parsed.recommended_ingredients)) {
        // [KLINIS KIMI P0-2] Post-filter 1: Filter alergi & sensitivitas dari user_clinical_memories
        if (memoriesRes.data && memoriesRes.data.length > 0) {
          const forbiddenEntities = memoriesRes.data
            .filter((m: any) => ['allergy', 'sensitivity', 'treatment_reaction'].includes(m.memory_type))
            .map((m: any) => String(m.entity || '').toLowerCase().trim())
            .filter(Boolean)

          if (forbiddenEntities.length > 0) {
            parsed.recommended_ingredients = parsed.recommended_ingredients.filter((ri: any) => {
              const name = String(typeof ri === 'string' ? ri : ri.name || '').toLowerCase()
              return !forbiddenEntities.some((forbidden: string) => name.includes(forbidden))
            })
          }
        }

        // [KLINIS KIMI & CHATGPT P0] Post-filter 2: Guardrail Barrier Rusak / Sensitif Ekstrem
        // Jika analisis menunjukkan skin barrier compromised, otomatis saring bahan eksfoliasi/retinoid agresif
        const analysisNotesLower = String(parsed.analysis_notes || '').toLowerCase()
        const isBarrierCompromised =
          analysisNotesLower.includes('barrier rusak') ||
          analysisNotesLower.includes('barrier terganggu') ||
          analysisNotesLower.includes('iritasi') ||
          analysisNotesLower.includes('kemerahan') ||
          analysisNotesLower.includes('mengelupas')

        if (isBarrierCompromised) {
          const aggressiveActives = ['retinol', 'retinoid', 'tretinoin', 'glycolic acid', 'lactic acid', 'salicylic acid >2%']
          parsed.recommended_ingredients = parsed.recommended_ingredients.filter((ri: any) => {
            const name = String(typeof ri === 'string' ? ri : ri.name || '').toLowerCase()
            return !aggressiveActives.some((agg) => name.includes(agg))
          })

          // Pastikan setidaknya ada kandungan pemulih barrier esensial
          const hasBarrierActive = parsed.recommended_ingredients.some((ri: any) => {
            const name = String(typeof ri === 'string' ? ri : ri.name || '').toLowerCase()
            return name.includes('ceramide') || name.includes('centella') || name.includes('hyaluronic')
          })
          if (!hasBarrierActive) {
            parsed.recommended_ingredients.unshift({
              name: 'Ceramide NP',
              purpose: 'Memperbaiki dan memperkuat lapisan pertahanan kulit (skin barrier) yang sedang sensitif/teriritasi.',
              priority: 'essential',
            })
          }
        }

        try {
          const matchedProducts = await matchProductsFromIngredients(
            supabaseService,
            parsed.recommended_ingredients as RecommendedIngredientInput[],
            parsed.skin_type as string | undefined
          )
          parsed.product_recommendations = matchedProducts
        } catch (matchErr) {
          console.error('[invoke-ai] Product matching failed:', matchErr)
          // Gagal matching bukan alasan gagalkan seluruh request — biarkan
          // parsed.product_recommendations kosong daripada crash.
          parsed.product_recommendations = []
        }

        // Fallback ingredient: jika hasil matching products kosong,
        // tampilkan recommended_ingredients yang dihasilkan AI sebagai teks pengganti
        if (
          !Array.isArray(parsed.product_recommendations) ||
          parsed.product_recommendations.length === 0
        ) {
          const recIngs = parsed.recommended_ingredients as any[]
          if (recIngs.length > 0) {
            // Normalize recommended_ingredients so frontend has consistent schema
            parsed.recommended_ingredients = recIngs.map((item: any) => ({
              name: typeof item === 'string' ? item : (item.name || item.ingredient || 'Bahan Aktif'),
              purpose: typeof item === 'object' ? (item.purpose || item.why_recommended || item.reason || '') : '',
              priority: typeof item === 'object' && item.priority ? item.priority : 'recommended',
            }))

            parsed.product_recommendations = parsed.recommended_ingredients.slice(0, 4).map((item: any) => {
              const name = item.name
              const reason =
                item.purpose ||
                `Kandungan ${name} terbukti secara dermatologis membantu merawat profil kulitmu.`
              const priority = item.priority || 'essential'

              return {
                product_name: name,
                category: priority === 'essential' ? 'Bahan Utama (Essential)' : 'Bahan Pendukung (Recommended)',
                match_score: priority === 'essential' ? 98 : 94,
                key_ingredients: [name],
                why_recommended: reason,
                priority,
                is_ingredient_recommendation: true,
              }
            })
          }
        }

        finalContent = JSON.stringify(parsed)
      }
    }

    // ---- Enrichment: timpa penilaian AI dengan data skincare_ingredients terverifikasi ----
    if (feature_slug === 'ingredient_scan') {
      const parsedForEnrich = tryParseAiJson(finalContent)
      if (
        parsedForEnrich &&
        parsedForEnrich.is_valid_skincare !== false &&
        Array.isArray(parsedForEnrich.ingredients_breakdown) &&
        parsedForEnrich.ingredients_breakdown.length > 0
      ) {
        const breakdown = parsedForEnrich.ingredients_breakdown as any[]
        const { data: verifiedMatches } = await supabaseService
          .from('skincare_ingredients')
          .select('canonical_name, aliases, safety_rating, comedogenic_rating')
          .eq('is_verified', true)
          .limit(500)

        if (verifiedMatches && verifiedMatches.length > 0) {
          const badgeLabelMap: Record<string, string> = {
            aman: 'Aman',
            hati: 'Perlu Perhatian',
            hindari: 'Hindari',
          }

          let enrichedCount = 0
          for (const item of breakdown) {
            const itemName = (item.name || '').toLowerCase().trim()
            const match = verifiedMatches.find((v: any) => {
              const dbNames = [v.canonical_name, ...(v.aliases ?? [])].map((n: string) => n.toLowerCase())
              return dbNames.includes(itemName)
            })
            if (match) {
              item.badge = match.safety_rating
              item.badgeLabel = badgeLabelMap[match.safety_rating] ?? item.badgeLabel
              item.comedogenic_score = match.comedogenic_rating
              item.verified_by_skincluv = true
              enrichedCount++
            }
          }

          // [KLINIS KIMI P0-3] Filter deterministik danger_combos terhadap verifiedInteractions dari DB
          if (Array.isArray(parsedForEnrich.danger_combos) && verifiedInteractions.length > 0) {
            parsedForEnrich.danger_combos = parsedForEnrich.danger_combos.filter((combo: any) => {
              const a = String(combo.ingredient_a || '').toLowerCase().trim()
              const b = String(combo.ingredient_b || '').toLowerCase().trim()
              return verifiedInteractions.some((v: any) => {
                const va = String(v.ingredient_a || '').toLowerCase().trim()
                const vb = String(v.ingredient_b || '').toLowerCase().trim()
                return (
                  ((a.includes(va) || va.includes(a)) && (b.includes(vb) || vb.includes(b))) ||
                  ((a.includes(vb) || vb.includes(a)) && (b.includes(va) || va.includes(b)))
                )
              })
            })
            enrichedCount++
          }

          if (enrichedCount > 0) {
            finalContent = JSON.stringify(parsedForEnrich)
          }
        }
      }
    }

    // ---- 11. Autonomous AI Flywheel (Knowledge Base Ingestion & Fine-Tuning Repository) ----
    if (feature_slug === 'ingredient_scan') {
      const parsedIng = tryParseAiJson(finalContent)
      if (parsedIng && parsedIng.is_valid_skincare !== false && Array.isArray(parsedIng.ingredients_breakdown)) {
        const prodName = (parsedIng.product_name as string) || 'Produk Skincare'
        const brandName = (parsedIng as any).brand || null
        const breakdown = parsedIng.ingredients_breakdown as any[]
        const formulaHash = breakdown
          .map((i: any) => (i.name || '').toLowerCase().trim())
          .filter(Boolean)
          .sort()
          .slice(0, 30)
          .join('|') || (prodName.toLowerCase() + '_' + Date.now())

        supabaseService
          .rpc('ingest_ingredient_scan_knowledge', {
            p_product_name: prodName,
            p_brand: brandName,
            p_formula_hash: formulaHash,
            p_ingredients: breakdown,
            p_safety_score: (parsedIng.safety_score as number) ?? 85,
          })
          .then(
            () => {},
            (kErr: unknown) => console.warn('[invoke-ai] Knowledge ingestion warning:', kErr)
          )

        // Fase 3d: Auto-enrichment bahan yang belum ada di skincare_ingredients via Gemini (non-blocking)
        const scanCandidateNames = breakdown
          .map((i: any) => (i.name || '').trim())
          .filter(Boolean)

        enrichMissingIngredientsWithGemini(supabaseService, scanCandidateNames)
          .catch((err) => console.warn('[invoke-ai] Ingredient scan auto-enrichment warning:', err))
      }
    }

    // ---- 12. Asynchronous AI-Based Memory Extraction for Chatbot (Consent Gated) ----
    if (feature_slug === 'chatbot' && hasMemoryConsent) {
      const lastUserMsg = trimmedMessages.filter((m) => m.role === 'user').at(-1)?.content
      if (typeof lastUserMsg === 'string') {
        const memPromise = extractMemoryWithAi(supabaseService, user.id, lastUserMsg, finalContent, model, apiKey)
          .catch((err) => console.warn('[invoke-ai] Memory extraction skipped:', err))
        if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && (globalThis as any).EdgeRuntime?.waitUntil) {
          (globalThis as any).EdgeRuntime.waitUntil(memPromise)
        }
      }
    }

    // ---- 13. Background Session Summary Generation (Consent Gated) ----
    // Trigger jika chat sesi sudah memiliki >= 4 pesan (generate/update dicek di dalam fungsi)
    const msgCount = typeof message_count === 'number' ? message_count : 0
    if (feature_slug === 'chatbot' && hasMemoryConsent && session_id && msgCount >= 4) {
      const summaryPromise = generateSessionSummary(supabaseService, session_id, user.id, model, apiKey)
        .catch((err) => console.warn('[invoke-ai] Session summary skipped:', err))
      if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && (globalThis as any).EdgeRuntime?.waitUntil) {
        (globalThis as any).EdgeRuntime.waitUntil(summaryPromise)
      }
    }

    // ---- Return response ----
    return new Response(
      JSON.stringify({
        success: true,
        content: finalContent,
        sources: searchSources,     // [] jika tidak ada search, atau array SearchSource
        deduct_mode: deductMode,
        tokens_used: aiResult!.tokensUsed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err: any) {
    console.error('[invoke-ai] Unhandled error:', err)
    const errDetail = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    return jsonError(`Internal server error: ${errDetail}`, 500)
  }
})

// ---- Helpers ----

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  )
}

async function rollback(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  featureId: string,
  subscriptionId: string | undefined,
  mode: 'quota' | 'coin' | null,
  coinAmount?: number,
  operationRef?: string
): Promise<void> {
  if (!mode) return
  try {
    await supabase.rpc('rollback_deduction', {
      p_user_id: userId,
      p_feature_id: featureId,
      p_subscription_id: subscriptionId ?? '00000000-0000-0000-0000-000000000000',
      p_mode: mode,
      p_coin_amount: mode === 'coin' ? (coinAmount ?? 0) : null,
      p_coin_ref: operationRef ?? null,
    })
  } catch (err) {
    console.error('[invoke-ai] rollback failed:', err)
  }
}

// ---- Product Matching Engine (untuk face_analysis) ----

interface RecommendedIngredientInput {
  name: string
  purpose?: string
  priority?: 'essential' | 'recommended' | 'optional'
}

interface ProductRow {
  id: string
  name: string
  brand: string | null
  category: string
  key_ingredients: string[]
  skin_type_fit: string[]
  price_estimate: string | null
  listing_type: 'organic' | 'affiliate' | 'endorse'
  sponsor_weight: number
}

const PRIORITY_WEIGHT: Record<string, number> = {
  essential: 3,
  recommended: 2,
  optional: 1,
}

// Ambang batas relevansi minimal sebelum listing_type boost boleh berlaku.
// Prinsip: produk affiliate/endorse HANYA boleh naik urutan kalau dia
// sudah cukup relevan lebih dulu — bukan karena dibayar semata.
const MIN_MATCH_SCORE_FOR_BOOST = 60
const MAX_PRODUCTS_RETURNED = 3

function normalizeIngredientName(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') return ''
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function matchProductsFromIngredients(
  supabaseService: ReturnType<typeof createClient>,
  recommendedIngredients: RecommendedIngredientInput[],
  skinType: string | undefined
): Promise<Array<{
  product_name: string
  brand?: string
  category: string
  match_score: number
  key_ingredients?: string[]
  why_recommended: string
  price_estimate?: string
}>> {
  if (!recommendedIngredients || !Array.isArray(recommendedIngredients) || recommendedIngredients.length === 0) return []

  const { data: products, error } = await supabaseService
    .from('products')
    .select('id, name, brand, category, key_ingredients, skin_type_fit, price_estimate, listing_type, sponsor_weight')
    .eq('is_active', true)

  if (error || !products || products.length === 0) return []

  const normalizedTargets = recommendedIngredients.map((ri: any) => ({
    normalized: normalizeIngredientName(typeof ri === 'string' ? ri : ri?.name),
    weight: PRIORITY_WEIGHT[typeof ri === 'object' && ri?.priority ? ri.priority : 'recommended'] ?? 2,
  }))

  const scored = (products as unknown as ProductRow[]).map((p) => {
    const productIngredientsNormalized = (p.key_ingredients ?? []).map(normalizeIngredientName)

    let rawScore = 0
    let maxPossible = 0
    for (const target of normalizedTargets) {
      maxPossible += target.weight
      const isMatch = productIngredientsNormalized.some(
        (pi) => pi.includes(target.normalized) || target.normalized.includes(pi)
      )
      if (isMatch) rawScore += target.weight
    }

    let matchScore = maxPossible > 0 ? Math.round((rawScore / maxPossible) * 100) : 0

    // Bonus kecil kalau skin_type_fit produk cocok dengan skin_type user
    if (skinType && p.skin_type_fit?.includes(skinType)) {
      matchScore = Math.min(100, matchScore + 10)
    }

    // Listing type boost — HANYA berlaku jika sudah lolos ambang batas relevansi
    let displayScore = matchScore
    if (matchScore >= MIN_MATCH_SCORE_FOR_BOOST && p.listing_type !== 'organic') {
      displayScore = Math.min(100, matchScore + (p.sponsor_weight ?? 0))
    }

    return { product: p, matchScore, displayScore }
  })

  return scored
    .filter((s) => s.matchScore > 0)
    .sort((a, b) => b.displayScore - a.displayScore)
    .slice(0, MAX_PRODUCTS_RETURNED)
    .map((s) => ({
      product_name: s.product.name,
      brand: s.product.brand ?? undefined,
      category: s.product.category,
      match_score: s.matchScore,
      key_ingredients: s.product.key_ingredients,
      why_recommended: `Mengandung bahan yang cocok dengan kebutuhan kulitmu saat ini (tingkat kecocokan ${s.matchScore}%).`,
      price_estimate: s.product.price_estimate ?? undefined,
    }))
}

function tryParseAiJson(content: string): Record<string, unknown> | null {
  try {
    const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

// ---- Fase 3d Helper: Background Auto-Enrichment via Gemini (is_verified = false) ----
async function enrichMissingIngredientsWithGemini(
  supabase: any,
  candidateNames: string[]
): Promise<void> {
  const validCandidates = candidateNames
    .map((n) => n.trim())
    .filter((n) => n.length >= 3 && n.length <= 50)

  if (validCandidates.length === 0) return

  // 1. Check which candidates are already in the DB (verified or unverified)
  const { data: existingRows } = await supabase
    .from('skincare_ingredients')
    .select('canonical_name')
    .in('canonical_name', validCandidates.slice(0, 15))

  const existingSet = new Set(
    (existingRows ?? []).map((r: any) => String(r.canonical_name).toLowerCase())
  )

  const trulyMissing = validCandidates
    .filter((n) => !existingSet.has(n.toLowerCase()))
    .slice(0, 3)

  if (trulyMissing.length === 0) return

  // 2. Resolve Gemini API key from Vault
  let geminiKey = ''
  try {
    const { data: keyData } = await supabase.rpc('get_decrypted_secret', {
      secret_name: 'gemini_api_key',
    })
    if (keyData) geminiKey = keyData as string
  } catch {
    // fallback to env
  }
  if (!geminiKey) {
    geminiKey = Deno.env.get('AI_KEY_GEMINI_API_KEY') || ''
  }
  if (!geminiKey) return

  for (const name of trulyMissing) {
    try {
      const promptText = `Analisis bahan kosmetik/skincare berikut: "${name}".
Jika ini BUKAN bahan/komposisi kosmetik (misal kata percakapan umum atau bukan zat kimia/tanaman untuk skincare), kembalikan HANYA: {"is_skincare_ingredient": false}.

Jika ini BENAR bahan kosmetik/skincare, kembalikan data ilmiah dalam format JSON murni:
{
  "is_skincare_ingredient": true,
  "canonical_name": "${name}",
  "inci_name": "nama INCI resmi jika ada",
  "category": "Active",
  "safety_rating": "aman",
  "comedogenic_rating": 0,
  "description": "Ringkasan manfaat dan fungsi bahan bagi kulit (1-2 kalimat).",
  "common_functions": ["fungsi 1", "fungsi 2"],
  "incompatible_with": ["bahan bentrok jika ada"]
}
Catatan:
- category pilih salah satu dari: Active, Antioxidant, Emollient, Hydrating, Preservative, Exfoliant, Other
- safety_rating pilih salah satu dari: aman, hati, hindari
- comedogenic_rating adalah angka bulat 0 sampai 5`

      const aiRes = await callAiProvider({
        provider: 'google',
        modelName: 'gemini-3.5-flash',
        apiKey: geminiKey,
        systemPrompt: 'Kamu adalah API database formulasi kosmetik. Selalu respon dengan JSON valid murni tanpa formatting markdown atau teks pengantar.',
        messages: [{ role: 'user', content: promptText }],
        parameters: { temperature: 0.1, max_tokens: 400 },
      })

      const parsed = tryParseAiJson(aiRes.content)
      if (parsed && parsed.is_skincare_ingredient !== false && parsed.canonical_name) {
        const safety = ['aman', 'hati', 'hindari'].includes(String(parsed.safety_rating).toLowerCase())
          ? String(parsed.safety_rating).toLowerCase()
          : 'aman'

        const comedo =
          typeof parsed.comedogenic_rating === 'number'
            ? Math.max(0, Math.min(5, Math.round(parsed.comedogenic_rating)))
            : 0

        await supabase.from('skincare_ingredients').upsert(
          {
            canonical_name: String(parsed.canonical_name).trim(),
            inci_name: parsed.inci_name ? String(parsed.inci_name).trim() : null,
            category: parsed.category ? String(parsed.category) : 'Other',
            safety_rating: safety,
            comedogenic_rating: comedo,
            description: parsed.description ? String(parsed.description) : null,
            common_functions: Array.isArray(parsed.common_functions) ? parsed.common_functions : [],
            incompatible_with: Array.isArray(parsed.incompatible_with) ? parsed.incompatible_with : [],
            is_verified: false,
            occurrence_count: 1,
          },
          { onConflict: 'canonical_name' }
        )
      }
    } catch (ingErr) {
      console.warn(`[invoke-ai] Auto-enrichment error for "${name}":`, ingErr)
    }
  }
}

/**
 * Ekstraksi memori percakapan berbasis AI (bukan regex) — HANYA dipanggil jika user sudah memberikan consent.
 * Mengekstrak fakta penting (alergi bahan, sensitivitas kulit, reaksi buruk, preferensi, tren kulit) secara terstruktur.
 */
async function extractMemoryWithAi(
  supabaseService: ReturnType<typeof createClient>,
  userId: string,
  userMessage: string,
  assistantReply: string,
  model: { provider: string; model_name: string; api_key_secret?: string },
  apiKey: string
): Promise<void> {
  if (!userMessage || userMessage.trim().length < 5) return

  const extractionPrompt = `Baca percakapan singkat berikut. Kalau ada fakta yang PANTAS diingat untuk personalisasi skincare ke depan (alergi bahan, sensitivitas kulit, reaksi buruk saat memakai produk tertentu, preferensi jenis produk, atau tren/kondisi kulit user), keluarkan sebagai JSON array. Jika tidak ada fakta penting, kembalikan array kosong [].

User: ${userMessage}
Asisten: ${assistantReply.slice(0, 500)}

Format WAJIB JSON murni tanpa markdown, tanpa teks pengantar:
[
  {
    "memory_type": "allergy" | "sensitivity" | "treatment_reaction" | "preference" | "skin_trend",
    "entity": "nama bahan atau kategori singkat",
    "clinical_fact": "keterangan fakta (1 kalimat padat)"
  }
]`

  let callProvider: 'google' | 'groq' | 'anthropic' = 'google'
  let callModel = 'gemini-3.6-flash'
  let callKey = apiKey
  let callParams: Record<string, any> = { thinking_budget: 0, max_tokens: 400, temperature: 0.1 }

  if (model.provider === 'groq') {
    callProvider = 'groq'
    callModel = 'llama-3.1-8b-instant'
    callParams = { max_tokens: 400, temperature: 0.1 }
  } else if (model.provider === 'google') {
    callProvider = 'google'
    callModel = 'gemini-3.6-flash'
  } else {
    try {
      const { data: keyData } = await supabaseService.rpc('get_decrypted_secret', {
        secret_name: 'gemini_api_key',
      })
      if (keyData) {
        callProvider = 'google'
        callModel = 'gemini-3.6-flash'
        callKey = keyData as string
      }
    } catch {
      // fallback
    }
  }

  const result = await callAiProvider({
    provider: callProvider,
    modelName: callModel,
    apiKey: callKey,
    systemPrompt: 'Kamu adalah ekstraktor fakta terstruktur untuk personalisasi skincare. Jawab HANYA JSON array valid, tanpa markdown, tanpa penjelasan.',
    messages: [{ role: 'user', content: extractionPrompt }],
    parameters: callParams,
  })

  const parsed = tryParseAiJson(result.content)
  const items = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as any)?.data)
    ? (parsed as any).data
    : null

  if (!items || items.length === 0) return

  const validTypes = ['allergy', 'sensitivity', 'treatment_reaction', 'preference', 'skin_trend']

  for (const item of items) {
    if (!item?.entity || !item?.clinical_fact) continue
    const memType = validTypes.includes(item.memory_type) ? item.memory_type : 'preference'
    const entityClean = String(item.entity).trim().slice(0, 40)
    if (entityClean.length < 2) continue

    try {
      const { data: existing } = await supabaseService
        .from('user_clinical_memories')
        .select('id')
        .eq('user_id', userId)
        .ilike('entity', entityClean)
        .maybeSingle()

      const payload = {
        memory_type: memType,
        clinical_fact: String(item.clinical_fact).trim().slice(0, 200),
        confidence_score: 0.95,
        is_active: true,
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        await supabaseService
          .from('user_clinical_memories')
          .update(payload)
          .eq('id', existing.id)
      } else {
        await supabaseService
          .from('user_clinical_memories')
          .insert({
            user_id: userId,
            entity: entityClean,
            source_feature: 'chatbot',
            ...payload,
          })
      }
    } catch (e) {
      console.warn('[invoke-ai] Error upserting memory:', e)
    }
  }
}

/**
 * Membuat atau memperbarui ringkasan sesi percakapan secara background.
 * Dipanggil setelah pesan ke-8, lalu setiap +5 pesan dalam sesi yang sama.
 * Menyimpan ke chat_session_summaries (upsert on session_id).
 */
async function generateSessionSummary(
  supabaseService: ReturnType<typeof createClient>,
  sessionId: string,
  userId: string,
  model: { provider: string; model_name: string },
  apiKey: string
): Promise<void> {
  try {
    // Ambil semua pesan dalam sesi ini (maksimal 40 pesan untuk summary)
    const { data: messages, error: msgError } = await supabaseService
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(40)

    if (msgError || !messages || messages.length < 4) {
      return // Terlalu sedikit untuk disimpulkan
    }

    // Cek apakah sudah pernah dibuat ringkasan untuk sesi ini
    const { data: existingSummary } = await supabaseService
      .from('chat_session_summaries')
      .select('message_count_at_summary')
      .eq('session_id', sessionId)
      .maybeSingle()

    // Jika sudah pernah disimpulkan, update HANYA jika ada penambahan minimal 5 pesan baru
    if (existingSummary && (messages.length - (existingSummary.message_count_at_summary || 0) < 5)) {
      return
    }

    const conversationText = messages
      .map((m: any) => `${m.role === 'user' ? 'User' : 'AI'}: ${String(m.content).slice(0, 200)}`)
      .join('\n')

    const summaryPrompt = `Buat ringkasan singkat percakapan skincare berikut dalam 2-3 kalimat (maksimal 550 karakter). Fokus pada: topik yang dibahas, kondisi kulit user, masalah/keluhan yang diidentifikasi, dan rekomendasi/produk penting yang dibahas. Jangan sebut nama-nama atau info pribadi.\n\nPercakapan:\n${conversationText}\n\nRingkasan (langsung tulis, tanpa label atau prefix):`

    let callProvider: 'google' | 'anthropic' | 'groq' = model.provider as any
    let callModel = model.model_name || 'gemini-3.5-flash'
    let callKey = apiKey

    if (model.provider !== 'google') {
      try {
        const { data: keyData } = await supabaseService.rpc('get_decrypted_secret', {
          secret_name: 'gemini_api_key',
        })
        if (keyData) {
          callKey = keyData as string
          callProvider = 'google'
          callModel = 'gemini-3.5-flash'
        }
      } catch {
        console.warn('[invoke-ai] Cannot resolve Gemini key for session summary')
        return
      }
    }

    const result = await callAiProvider({
      provider: callProvider,
      modelName: callModel,
      apiKey: callKey,
      systemPrompt: 'Kamu adalah asisten yang membuat ringkasan percakapan skincare singkat dan informatif. Jawab langsung tanpa label, prefix, atau markdown.',
      messages: [{ role: 'user', content: summaryPrompt }],
      parameters: { temperature: 0.2, max_tokens: 200 },
    })

    const summaryText = result?.content ? result.content.trim().slice(0, 600) : ''
    if (summaryText.length < 10) return

    // Upsert — satu baris per session_id
    const { error: upsertErr } = await supabaseService.from('chat_session_summaries').upsert(
      {
        session_id: sessionId,
        user_id: userId,
        summary_text: summaryText,
        message_count_at_summary: messages.length,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'session_id' }
    )

    if (upsertErr) {
      console.warn('[invoke-ai] Error upserting session summary:', upsertErr)
    } else {
      console.log(`[invoke-ai] Successfully saved session summary for ${sessionId}`)
    }
  } catch (err) {
    console.warn('[invoke-ai] generateSessionSummary unexpected error:', err)
  }
}
