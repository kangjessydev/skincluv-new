// _shared/searchProvider.ts
// Pluggable web search provider untuk Skincluv Knowledge Pipeline.
// Alur: query → normalize → hash → cek cache DB → cache hit? return
//       cache miss? → call active provider (Tavily / Brave) → simpan ke cache → return

export interface SearchSource {
  title: string
  url: string
  snippet: string
  score?: number
}

// ---------------------------------------------------------------------------
// Enhanced trigger patterns (handles typos: 'sumbenrya', 'refrensi', 'buktinya', etc.)
// ---------------------------------------------------------------------------
const SEARCH_TRIGGER_PATTERNS = [
  /s+u+m+b+[enr]+/i,                          // sumber, sumbenr, sumbr, sumbenrya, sumbernya
  /r+e+f+[er]*n+s+/i,                         // referensi, refrensi, reverensi
  /b+u+k+t+i+/i,                              // bukti, buktinya, buktikan
  /j+u+r+n+a+l+/i,                            // jurnal, jurnalnya
  /s+t+u+d+i+/i,                              // studi, studinya
  /p+e+n+e+l+i+t+i+a+n+/i,                    // penelitian
  /r+i+s+e+t+/i,                              // riset
  /k+l+i+n+i+s+/i,                            // klinis
  /e+v+i+d+e+n+c+e+/i,                        // evidence, evidence-based
  /b+e+n+a+r+k+a+h+/i,                        // benarkah
  /t+e+r+b+u+k+t+i+/i,                        // terbukti
  /v+a+l+i+d+/i,                              // valid, validkah, valid ga
  /a+p+a(\s*k+a+h)?\s+b+e+n+a?r+/i,           // apakah benar, apa benar, emang bener
  /d+a+r+i+\s+m+a+n+a+(\s+i+n+f+o+)?/i,      // dari mana infonya
  /c+a+r+i+(k+a+n)?\s+(d+i+\s+)?(web|internet|google)/i, // cari di web/internet
  /c+e+k+\s+(d+i+\s+)?(web|internet|google)/i,           // cek di web/internet
]

const SEARCH_TRIGGER_KEYWORDS = [
  'terbaru', 'update terbaru', 'baru rilis', 'baru keluar', 'sekarang ini',
  'best seller', 'produk terbaik', 'produk terpopuler', 'produk baru',
  'berapa persen', 'dosis', 'konsentrasi', 'kandungan berapa',
  'research', 'study', 'source', 'reference', 'evidence based',
  'clinical', 'proven', 'latest', 'recent study',
]

/**
 * Deteksi apakah pesan user butuh web search.
 * Regex pattern-matching cerdas + toleransi typo.
 */
export function needsWebSearch(message: string): boolean {
  const lower = message.toLowerCase().trim()
  if (SEARCH_TRIGGER_PATTERNS.some((p) => p.test(lower))) {
    return true
  }
  return SEARCH_TRIGGER_KEYWORDS.some((kw) => lower.includes(kw))
}

// ---------------------------------------------------------------------------
// Entitas & Bahan Skincare untuk Contextual Query Building
// ---------------------------------------------------------------------------
const KNOWN_SKINCARE_ENTITIES = [
  // Ingredients & actives
  'sodium lauryl sulfate', 'sodium laureth sulfate', 'sls', 'sles',
  'niacinamide', 'retinol', 'retinoid', 'tretinoin', 'adapalene',
  'salicylic acid', 'hyaluronic acid', 'ceramide', 'glycolic acid',
  'azelaic acid', 'tranexamic acid', 'benzoyl peroxide', 'centella asiatica',
  'cica', 'peptides', 'zinc pca', 'zinc', 'squalane', 'tea tree',
  'bakuchiol', 'alpha arbutin', 'vitamin c', 'ascorbic acid', 'lactic acid',
  'paraben', 'alcohol', 'fragrance', 'sulfate', 'mineral oil',
  // Product forms
  'facial wash', 'cleanser', 'pencuci muka', 'sabun cuci muka',
  'sunscreen', 'sunblock', 'moisturizer', 'pelembap', 'serum',
  'toner', 'micellar water', 'exfoliator', 'scrub',
  // Concerns & conditions
  'skin barrier', 'gatal', 'iritasi', 'kemerahan', 'redness',
  'jerawat', 'breakout', 'purging', 'komedo', 'kulit kering',
  'kulit berminyak', 'kulit sensitif', 'kulit kombinasi', 'flek hitam',
  'hiperpigmentasi', 'pori-pori', 'dermatitis', 'eczema',
  // Popular brands
  'biore', 'kahf', 'wardah', 'somethinc', 'skintific', 'cerave',
  'cetaphil', 'cosrx', 'the ordinary', 'avoskin', 'scarlett',
  'garnier', 'nivea', 'ponds', 'azarine', 'glad2glow', 'originote',
]

/**
 * Ekstraksi entitas/istilah skincare dari potongan teks riwayat percakapan.
 */
export function extractSkincareEntities(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []

  for (const entity of KNOWN_SKINCARE_ENTITIES) {
    const escaped = entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'i')
    if (regex.test(lower)) {
      found.push(entity)
    }
  }

  // Juga tangkap nama produk / brand yang berhuruf kapital (misal 'Biore', 'Kahf', 'Cerave')
  const capitalMatches = text.match(/\b[A-Z][a-zA-Z0-9-]{2,}\b/g) ?? []
  const stopWords = new Set([
    'Halo', 'Wajar', 'Berdasarkan', 'Namun', 'Selain', 'Kalau', 'Ingat', 'Saya',
    'Kamu', 'Anda', 'Untuk', 'Dengan', 'Dalam', 'Juga', 'Bisa', 'Coba', 'Saran',
    'Tips', 'Tapi', 'Mungkin', 'Karena', 'Jadi', 'Ketika', 'Saat', 'Tentu', 'Hello',
    'Baik', 'Pernah', 'Mohon', 'Tolong', 'Kalian', 'Semua', 'Apakah', 'Berikut'
  ])

  for (const cap of capitalMatches) {
    const low = cap.toLowerCase()
    if (!stopWords.has(cap) && !found.includes(low)) {
      found.push(low)
    }
  }

  return Array.from(new Set(found))
}

/**
 * Menyusun query pencarian web secara kontekstual.
 * Mencegah pengiriman string mentah seperti "berikan sumbernya" yang menyebabkan
 * mesin pencari mengembalikan teks acak / non-skincare (seperti kitab suci atau game).
 */
export function buildSearchQuery(
  userMsg: string,
  history: Array<{ role: string; content: any }> = []
): string {
  const cleanMsg = userMsg.trim()

  // Pola permintaan sumber umum (tanpa subjek spesifik)
  const genericSourceRegex = /^(tolong\s+|bantu\s+carikan\s+|bisa\s+carikan\s+|coba\s+cari(kan)?\s+|berikan\s+|tunjukkan\s+|mana\s+|apa\s+ada\s+|minta\s+|ada\s+)?(sumber(nya)?|sumbenr(ya)?|referensi(nya)?|bukti(nya)?|jurnal(nya)?|studi(nya)?|penelitian(nya)?|riset(nya)?|tautan(nya)?|link(nya)?)\s*(ga|dong|ya|kah|\?)?$/i

  // Hilangkan kata filler dan tanda tanya
  const strippedMsg = cleanMsg
    .replace(/(\b(tolong|bantu|coba|carikan|cari|cek|ada|mana|minta|mohon|berikan)\b|\b(sumber(nya)?|sumbenr(ya)?|bukti(nya)?|referensi(nya)?|jurnal(nya)?|studi(nya)?|penelitian(nya)?)\b|\b(ga|dong|ya|sih|kan|kah|kok)\b|\?)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const isGeneric = genericSourceRegex.test(cleanMsg) || strippedMsg.length < 8
  const hasDeictic = /\b(itu|tersebut|tadi|dimaksud|di\s*atas|sebelumnya)\b/i.test(cleanMsg)

  const terms: string[] = []

  // Jika pesan user bersifat generik ("berikan sumbernya") atau merujuk ke topik sebelumnya ("bahan itu")
  if (isGeneric || hasDeictic || strippedMsg.length < 15) {
    // Ambil konteks dari pesan bot terakhir dan user sebelumnya
    const recentMessages = history.slice(-4)
    const contextText = recentMessages
      .map((m) => (typeof m.content === 'string' ? m.content : ''))
      .join(' ')

    const entities = extractSkincareEntities(contextText)
    if (entities.length > 0) {
      for (const e of entities) {
        if (!terms.includes(e)) terms.push(e)
        if (terms.length >= 3) break
      }
    }

    if (strippedMsg.length >= 4 && !isGeneric) {
      terms.push(strippedMsg)
    }
  } else {
    // Pertanyaan user sudah spesifik
    terms.push(strippedMsg)
  }

  const combined = terms.join(' ').trim()
  const hasSkincareAnchor = /skincare|kulit|wajah|dermatolog|skin|facial/i.test(combined)
  const finalQuery = hasSkincareAnchor ? combined : `${combined} skincare dermatologi`

  return finalQuery.replace(/\s+/g, ' ').slice(0, 150).trim()
}

// ---------------------------------------------------------------------------
// Simple hash function (tidak butuh crypto untuk query caching)
// ---------------------------------------------------------------------------
export function hashQuery(query: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 200)
  // Simple djb2 hash — cukup untuk dedup, bukan keamanan
  let h = 5381
  for (let i = 0; i < normalized.length; i++) {
    h = ((h << 5) + h) ^ normalized.charCodeAt(i)
    h = h >>> 0 // unsigned 32-bit
  }
  return h.toString(36) + '_' + normalized.length
}

// ---------------------------------------------------------------------------
// Cache lookup
// ---------------------------------------------------------------------------
export async function fetchFromCache(
  supabase: any,
  queryHash: string
): Promise<SearchSource[] | null> {
  try {
    const { data } = await supabase
      .from('skincluv_knowledge_cache')
      .select('sources, hit_count')
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (!data) return null

    // Increment hit count (fire-and-forget)
    supabase
      .from('skincluv_knowledge_cache')
      .update({ hit_count: (data.hit_count ?? 1) + 1 })
      .eq('query_hash', queryHash)
      .then(() => {})

    return Array.isArray(data.sources) ? (data.sources as SearchSource[]) : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Save to cache (upsert)
// ---------------------------------------------------------------------------
export async function saveToCache(
  supabase: any,
  queryHash: string,
  queryText: string,
  sources: SearchSource[]
): Promise<void> {
  try {
    await supabase.from('skincluv_knowledge_cache').upsert(
      {
        query_hash: queryHash,
        query_text: queryText.slice(0, 300),
        sources,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        hit_count: 1,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'query_hash' }
    )
  } catch (err) {
    console.warn('[searchProvider] Failed to save cache:', err)
  }
}

// ---------------------------------------------------------------------------
// Tavily API call
// ---------------------------------------------------------------------------
async function callTavily(query: string, apiKey: string): Promise<SearchSource[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,   // Tavily uses Bearer token, not api_key in body
    },
    body: JSON.stringify({
      query,
      search_depth: 'advanced',   // 'advanced' = hasil lebih relevan
      max_results: 3,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tavily error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const results = Array.isArray(data.results) ? data.results : []

  return results.slice(0, 3).map((r: any) => ({
    title: String(r.title ?? '').slice(0, 120),
    url: String(r.url ?? ''),
    snippet: String(r.content ?? r.snippet ?? '').slice(0, 300),
    score: typeof r.score === 'number' ? r.score : undefined,
  }))
}

// ---------------------------------------------------------------------------
// Brave Search API call
// ---------------------------------------------------------------------------
async function callBrave(query: string, apiKey: string): Promise<SearchSource[]> {
  const url = new URL('https://api.search.brave.com/res/v1/web/search')
  url.searchParams.set('q', query)
  url.searchParams.set('count', '3')
  url.searchParams.set('safesearch', 'moderate')

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Brave error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const results = Array.isArray(data.web?.results) ? data.web.results : []

  return results.slice(0, 3).map((r: any) => ({
    title: String(r.title ?? '').slice(0, 120),
    url: String(r.url ?? ''),
    snippet: String(r.description ?? '').slice(0, 300),
  }))
}

// ---------------------------------------------------------------------------
// Main: fetch dari cache atau call provider aktif
// ---------------------------------------------------------------------------
export async function fetchSearchResults(
  supabase: any,
  query: string
): Promise<SearchSource[]> {
  const queryHash = hashQuery(query)

  // 1. Cek cache dulu
  const cached = await fetchFromCache(supabase, queryHash)
  if (cached && cached.length > 0) {
    console.log(`[searchProvider] Cache hit for hash: ${queryHash}`)
    return cached
  }

  // 2. Load active provider dari DB
  const { data: providerData } = await supabase
    .from('search_providers')
    .select('name, api_key_secret, base_url')
    .eq('is_active', true)
    .order('priority', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!providerData) {
    console.log('[searchProvider] No active search provider configured — skipping search')
    return []
  }

  // 3. Resolve API key dari Vault
  let apiKey = ''
  try {
    const { data: keyData } = await supabase.rpc('get_decrypted_secret', {
      secret_name: providerData.api_key_secret,
    })
    if (keyData) apiKey = String(keyData)
  } catch {
    // fallback env
  }
  if (!apiKey) {
    const envKey = `AI_KEY_${providerData.api_key_secret.toUpperCase()}`
    apiKey = Deno.env.get(envKey) ?? ''
  }
  if (!apiKey) {
    console.warn(`[searchProvider] API key not found for provider: ${providerData.name}`)
    return []
  }

  // 4. Call provider
  let results: SearchSource[] = []
  try {
    if (providerData.name === 'tavily') {
      results = await callTavily(query, apiKey)
    } else if (providerData.name === 'brave') {
      results = await callBrave(query, apiKey)
    } else {
      console.warn(`[searchProvider] Unknown provider: ${providerData.name}`)
      return []
    }
  } catch (err) {
    console.warn(`[searchProvider] Search call failed:`, err)
    return []
  }

  // 5. Filter relevansi domain skincare (cegah sumber halu/tidak relevan masuk ke AI)
  const filtered = filterSkincareSources(results)
  if (filtered.length < results.length) {
    console.log(`[searchProvider] Filtered out ${results.length - filtered.length} non-skincare sources`)
  }

  // 6. Simpan ke cache jika ada hasil relevan (background, non-blocking)
  if (filtered.length > 0) {
    saveToCache(supabase, queryHash, query, filtered).catch(() => {})
  }

  return filtered
}

const RELEVANCE_KEYWORDS = [
  'kulit', 'skin', 'skincare', 'dermatolog', 'dermatology', 'wajah', 'face',
  'cleanser', 'pencuci', 'sabun', 'facial', 'sls', 'sles', 'sulfate',
  'barrier', 'iritasi', 'irritat', 'gatal', 'itch', 'acne', 'jerawat',
  'retinol', 'niacinamide', 'ceramide', 'hyaluronic', 'salicylic',
  'moisturiz', 'sunscreen', 'serum', 'toner', 'produk', 'beauty',
  'kosmetik', 'cosmetic', 'alergi', 'allerg', 'ingredient', 'kandungan',
  'health', 'kesehatan', 'medis', 'medical', 'jurnal', 'penelitian', 'studi',
  'doctor', 'dokter', 'klinik', 'clinic', 'sebum', 'comedogenic', 'pore',
  'pori', 'sensitif', 'sensitive', 'inci', 'treatment', 'perawatan',
  'pom', 'bpom', 'fda', 'cosmetics', 'dermatitis'
]

/**
 * Memastikan hasil pencarian relevan dengan kesehatan kulit / skincare / dermatologi.
 * Membuang hasil yang melenceng jauh (seperti teks agama, game, politik, sampah kota, dll.).
 */
export function filterSkincareSources(sources: SearchSource[]): SearchSource[] {
  return sources.filter((s) => {
    const text = `${s.title} ${s.snippet} ${s.url}`.toLowerCase()
    return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw))
  })
}

/**
 * Format sources untuk injeksi ke system prompt AI.
 */
export function formatSourcesForPrompt(sources: SearchSource[]): string {
  return sources
    .map((s, i) => `[${i + 1}] ${s.title}\nURL: ${s.url}\n${s.snippet}`)
    .join('\n\n')
}
