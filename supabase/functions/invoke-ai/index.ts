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
//  6. Call AI provider (with rollback on error — Opsi A)
//  7. Log result
//  8. Return response

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { callAiProvider, interpolatePrompt, estimateCostUsd } from '../_shared/aiProviders.ts'

const RATE_LIMIT_WINDOW_MS = 60 * 1000   // 1 minute
const RATE_LIMIT_MAX       = 10          // max requests per window
// Cost in Credits per feature (when quota is exhausted or free tier)
const CREDIT_COST_PER_FEATURE: Record<string, number> = {
  face_validation: 1,
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
    const { feature_slug, messages, input_context, use_coins } = body as {
      feature_slug: string
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      input_context?: Record<string, string>
      use_coins?: boolean
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

    // Deep context memory (10 messages) for PRO chatbot, 6 messages for standard
    const historyLimit = isPro && feature_slug === 'chatbot' ? 10 : 6
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

      // Proceed with credit deduction (using atomic deduct_coins function)
      const tempRef = crypto.randomUUID()
      const { data: creditOk } = await supabaseService.rpc('deduct_coins', {
        p_user_id: user.id,
        p_amount: creditCost,
        p_reference_id: tempRef,
      })

      if (!creditOk) {
        return jsonError('Credits tidak mencukupi. Selesaikan misi untuk mendapatkan Credits atau upgrade ke paket Glow/Pro.', 402)
      }
      deductMode = 'coin'
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
      await rollback(supabaseService, user.id, deductedFeatureId, subscription?.id, deductMode, creditCost)
      return jsonError('AI provider API key not configured. Check Vault secret name.', 503)
    }

    // ---- 7. Build prompt context & Attach Multimodal Image if present ----
    // Fetch active skin profile, user profile & clinical memories for context injection
    const [skinProfileRes, userProfileRes, memoriesRes] = await Promise.all([
      supabaseService
        .from('skin_profiles')
        .select('skin_type, skin_concerns, analysis_notes')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle(),
      supabaseService
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle(),
      supabaseService
        .from('user_clinical_memories')
        .select('memory_type, entity, clinical_fact')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(8),
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

    // Injeksi Memori Klinis Jangka Panjang Pasien (untuk asisten chatbot)
    if (feature_slug === 'chatbot' && memoriesRes.data && memoriesRes.data.length > 0) {
      const memoryLines = memoriesRes.data
        .map((m: any) => `- [${String(m.memory_type).toUpperCase()}]: ${m.entity} (${m.clinical_fact})`)
        .join('\n')
      systemPrompt += `\n\n[MEMORI KLINIS PASIEN TERVERIFIKASI]:\n${memoryLines}\nGunakan catatan memori klinis di atas untuk mempersonalisasi saran dan secara mutlak menghindari bahan/treatment yang berpotensi memicu reaksi buruk pada pasien.`
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

    // ---- 8. Call AI Provider ----
    const startTime = Date.now()
    let aiResult
    let aiError: Error | null = null

    try {
      aiResult = await callAiProvider({
        provider: model.provider as 'google' | 'anthropic',
        modelName: model.model_name,
        apiKey,
        systemPrompt,
        messages: finalMessages as any[],
        parameters: model.parameters as Record<string, number>,
      })
    } catch (err) {
      aiError = err as Error
    }

    const latencyMs = Date.now() - startTime

    // ---- Opsi A: Rollback on provider error ----
    if (aiError) {
      await rollback(supabaseService, user.id, deductedFeatureId, subscription?.id, deductMode, creditCost)

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
    const costUsd = estimateCostUsd(model.model_name, aiResult!.tokensUsed)

    await supabaseService.from('ai_request_logs').insert({
      user_id: user.id,
      feature_id: feature.id,
      prompt_version_id: prompt.id,
      model_config_id: model.id,
      input_summary: messages.at(-1)?.content?.slice(0, 200),
      output_summary: aiResult!.content.slice(0, 300),
      raw_output: aiResult!.rawResponse,
      tokens_used: aiResult!.tokensUsed,
      latency_ms: latencyMs,
      cost_usd: costUsd,
      status: 'success',
    })

    // ---- 9b. Track mission progress server-side (Anti-Spoofing) ----
    const MISSION_ACTION_MAP: Record<string, string> = {
      face_analysis: 'face_scan',
      ingredient_scan: 'ingredient_scan',
    }
    const missionAction = MISSION_ACTION_MAP[feature_slug]
    if (missionAction) {
      supabaseService
        .rpc('record_mission_progress', {
          p_user_id: user.id,
          p_action: missionAction,
          p_count: 1,
        })
        .then(
          () => {},
          (mErr: unknown) => console.error('[invoke-ai] Error recording mission progress:', mErr)
        )
    }

    // ---- 10. Product Matching Engine (khusus face_analysis) ----
    let finalContent = aiResult!.content

    if (feature_slug === 'face_analysis') {
      const parsed = tryParseAiJson(aiResult!.content)
      if (parsed && parsed.is_valid_face !== false && Array.isArray(parsed.recommended_ingredients)) {
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
            parsed.product_recommendations = recIngs.slice(0, 3).map((item: any) => {
              const name = typeof item === 'string' ? item : item.name || 'Bahan Aktif'
              const reason =
                typeof item === 'object' && item.reason
                  ? item.reason
                  : `Kandungan ${name} cocok untuk kondisi kulitmu saat ini.`

              return {
                product_name: `Kandungan yang cocok: ${name}`,
                category: 'Rekomendasi Bahan',
                match_score: 95,
                key_ingredients: [name],
                why_recommended: reason,
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


    // ---- Return response ----
    return new Response(
      JSON.stringify({
        success: true,
        content: finalContent,
        deduct_mode: deductMode,
        tokens_used: aiResult!.tokensUsed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    console.error('[invoke-ai] Unhandled error:', err)
    return jsonError('Internal server error', 500)
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
  coinAmount?: number
): Promise<void> {
  if (!mode) return
  try {
    await supabase.rpc('rollback_deduction', {
      p_user_id: userId,
      p_feature_id: featureId,
      p_subscription_id: subscriptionId ?? '00000000-0000-0000-0000-000000000000',
      p_mode: mode,
      p_coin_amount: mode === 'coin' ? (coinAmount ?? 0) : null,
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

function normalizeIngredientName(name: string): string {
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
  if (!recommendedIngredients || recommendedIngredients.length === 0) return []

  const { data: products, error } = await supabaseService
    .from('products')
    .select('id, name, brand, category, key_ingredients, skin_type_fit, price_estimate, listing_type, sponsor_weight')
    .eq('is_active', true)

  if (error || !products || products.length === 0) return []

  const normalizedTargets = recommendedIngredients.map((ri) => ({
    normalized: normalizeIngredientName(ri.name),
    weight: PRIORITY_WEIGHT[ri.priority ?? 'recommended'] ?? 2,
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
        modelName: 'gemini-2.0-flash',
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
