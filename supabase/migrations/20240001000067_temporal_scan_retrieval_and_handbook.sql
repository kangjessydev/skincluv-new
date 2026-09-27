-- ==============================================================================
-- Migration 067: Deterministic Temporal Scan History & Internal Skincluv Handbook
-- RFC 013 AI Council Consensus (ChatGPT, DeepSeek, Kimi, Antigravity)
-- Principles:
-- 1. Invariant 10: Strict Server Resource Authority (no raw UUIDs from LLM)
-- 2. Timezone-aware half-open intervals [start, end)
-- 3. Nearest-before and nearest-after deterministic fallback
-- 4. Product Ontology Handbook with "what_it_is_not" anti-hallucination boundaries
-- 5. Timeline Index (~30 tokens) injection in get_chatbot_user_context
-- ==============================================================================

-- 1. Create table public.skincluv_handbook
CREATE TABLE IF NOT EXISTS public.skincluv_handbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  canonical_name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  what_it_is_not TEXT NOT NULL,
  workflow TEXT,
  is_published BOOLEAN DEFAULT true,
  last_reviewed TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for fast search & category lookups
CREATE INDEX IF NOT EXISTS idx_skincluv_handbook_slug ON public.skincluv_handbook (slug);
CREATE INDEX IF NOT EXISTS idx_skincluv_handbook_category ON public.skincluv_handbook (category) WHERE is_published = true;

-- RLS: Public read, authenticated read, service_role write
ALTER TABLE public.skincluv_handbook ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'skincluv_handbook' AND policyname = 'Anyone can view published handbook'
  ) THEN
    CREATE POLICY "Anyone can view published handbook"
      ON public.skincluv_handbook
      FOR SELECT
      USING (is_published = true);
  END IF;
END $$;

-- 2. Seed 10 Core Handbook Entries (Kimi & ChatGPT Consensus)
INSERT INTO public.skincluv_handbook (slug, canonical_name, aliases, category, description, what_it_is_not, workflow)
VALUES
  (
    'face_scan',
    'Scan Wajah AI',
    ARRAY['face scan', 'scan muka', 'analisis wajah', 'cek kulit'],
    'feature',
    'Fitur pemindaian foto wajah menggunakan 4 gerbang validasi kilat dan model AI dermatologis untuk menganalisis kondisi pori, sebum, kemerahan, kerutan, dan tipe kulit.',
    'Bukan diagnosis klinis dokter, bukan penentu resep obat keras, dan foto asli wajah tidak disimpan di server.',
    'Ambil foto wajah terang -> Gatekeeper validasi 0-kredit -> Analisis klinis 5-kredit -> Tampil skor & evaluasi area.'
  ),
  (
    'ingredient_scan',
    'Scan Bahan Produk (Ingredient Scan)',
    ARRAY['ingredient scan', 'cek komposisi', 'cek produk', 'cek skincare', 'analisis bahan'],
    'feature',
    'Fitur pemindaian label atau OCR teks komposisi skincare untuk mengevaluasi Skor Keamanan Formula (0-100 WPS), panduan layering antar-bahan aktif, dan deteksi zat terlarang BPOM.',
    'Bukan uji laboratorium klinis fisik produk dan bukan penjamin bebas alergi personal 100%.',
    'Foto label kemasan/ketik teks komposisi -> Evaluasi WPS & deteksi zat terlarang -> Tampil ringkasan keamanan & rekomendasi.'
  ),
  (
    'skinsistant',
    'Skinsistant AI Chatbot',
    ARRAY['skinsistant', 'chatbot', 'konsultasi', 'tanya dokter', 'asisten kulit'],
    'feature',
    'Asisten kecerdasan buatan untuk konsultasi rutinitas skincare, edukasi bahan kosmetik, dan pembahasan riwayat scan pengguna secara kontekstual.',
    'Bukan dokter spesialis kulit berizin dan tidak melayani diagnosa penyakit kulit darurat/infeksius.',
    'Ketik pertanyaan di chat -> AI merujuk profil kulit & scan terverifikasi -> Menjawab ramah & lampirkan visual card jika relevan.'
  ),
  (
    'scan_history',
    'Riwayat Scan & Grafik Perkembangan',
    ARRAY['riwayat', 'history', 'grafik', 'perkembangan kulit', 'trend'],
    'feature',
    'Pusat rekam jejak terpadu (Dual-Tab) untuk melihat riwayat scan wajah dan analisis produk skincare terdahulu, dilengkapi grafik tren median 28 hari.',
    'Grafik perkembangan hanya bersumber dari foto baru yang berbeda; foto duplikat (is_repeat = true) tidak dimasukkan ke dalam perhitungan tren.',
    'Buka menu Riwayat -> Pilih Tab Wajah atau Tab Produk -> Klik item untuk melihat modal evaluasi mendalam.'
  ),
  (
    'misi_glow',
    'Misi Glow (Daily Missions)',
    ARRAY['misi', 'misi glow', 'misi harian', 'daily missions', 'quest'],
    'gamification',
    'Fitur gamifikasi harian, mingguan, dan milestone di mana pengguna menyelesaikan aktivitas skincare untuk mengklaim reward Credits/Koin gratis.',
    'BUKAN rutinitas cuci muka/skincare wajib, BUKAN checklist perawatan medis, dan reward koin diklaim melalui tombol di halaman Misi.',
    'Buka menu Misi -> Lakukan aktivitas (misal scan wajah/chat) -> Klik tombol Klaim -> Saldo Credits bertambah instan.'
  ),
  (
    'koin_credits',
    'Koin & Credits',
    ARRAY['koin', 'coin', 'credits', 'saldo', 'biaya'],
    'billing',
    'Satuan alat tukar komputasi di Skincluv yang digunakan untuk menjalankan pemindaian AI dan obrolan konsultasi Skinsistant.',
    'Koin bukan mata uang kripto dan saldo dicatat dalam ledger atomik permanen yang tidak dapat dimanipulasi.',
    'Dapat diperoleh gratis dari Misi Glow atau dibeli melalui top-up paket koin via Tripay.'
  ),
  (
    'glow_pass_pro_pass',
    'Paket GLOW Club & PRO Club',
    ARRAY['glow club', 'pro club', 'langganan', 'paket', 'upgrade'],
    'subscription',
    'Paket keanggotaan prabayar (prepaid) 30 hari yang memberikan kuota scan bulanan melimpah, konsultasi prioritas, dan panduan layering mendalam.',
    'BUKAN produk skincare fisik berupa botol/krim kosmetik, BUKAN langganan auto-debit berulang, dan otomatis kembali ke Free Tier tanpa penalti saat masa aktif berakhir.',
    'Beli paket di halaman Pricing -> Bayar sekali pakai via QRIS/VA Tripay -> Kuota aktif 30 hari.'
  ),
  (
    'free_tier',
    'Free Tier (Akun Gratis)',
    ARRAY['free', 'gratis', 'akun gratis'],
    'subscription',
    'Tingkat akun dasar gratis untuk semua pengguna terdaftar yang dapat mengumpulkan Credits gratis tanpa batas waktu melalui fitur Misi Glow.',
    'Bukan akun percobaan (trial) terbatas waktu; fitur inti tetap dapat digunakan selamanya dengan Credits misi.',
    'Daftar akun -> Mulai dengan saldo selamat datang -> Kerjakan misi setiap hari untuk terus menikmati fitur.'
  ),
  (
    'skin_profile',
    'Profil Kulit Pengguna',
    ARRAY['profil kulit', 'skin type', 'tipe kulit', 'keluhan'],
    'profile',
    'Pengaturan karakteristik dasar kulit pengguna (kering, berminyak, kombinasi, sensitif) serta keluhan aktif yang menjadi acuan personalisasi saran asisten.',
    'Bukan vonis medis permanen; pengguna dapat memperbarui profil kapan saja di halaman Profil.',
    'Isi formulir skin quiz -> AI menyesuaikan rekomendasi bahan -> Perbarui profil jika kondisi kulit berubah.'
  ),
  (
    'data_privacy_consent',
    'Keamanan Data & Privasi (UU PDP)',
    ARRAY['privasi', 'consent', 'keamanan data', 'hapus data', 'uu pdp'],
    'policy',
    'Kebijakan kepatuhan privasi data di mana pengguna memiliki kendali penuh atas memori chatbot dan rekam jejak scan melalui toggle consent dan hak hapus data (Right to be Forgotten).',
    'Foto wajah pengguna tidak pernah dijual ke pihak ketiga dan memori klinis langsung dihapus bersih secara permanen jika consent dicabut.',
    'Buka pengaturan privasi di toolbar Chatbot -> Aktifkan/nonaktifkan memori kapan saja -> Data terhapus atomik saat dimatikan.'
  )
ON CONFLICT (slug) DO UPDATE
SET
  canonical_name = EXCLUDED.canonical_name,
  aliases = EXCLUDED.aliases,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  what_it_is_not = EXCLUDED.what_it_is_not,
  workflow = EXCLUDED.workflow,
  last_reviewed = now();

-- 3. Indexes for Temporal Scan Queries (ChatGPT Consensus)
CREATE INDEX IF NOT EXISTS idx_face_scans_user_created_desc ON public.face_scans (user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_ingredient_scans_user_created_desc ON public.ingredient_scans (user_id, created_at DESC, id DESC);

-- 4. RPC: get_chatbot_scans_by_period (Timezone-Aware Half-Open Interval)
CREATE OR REPLACE FUNCTION public.get_chatbot_scans_by_period(
  p_start_date DATE,
  p_end_date DATE,
  p_tz_offset_minutes INT DEFAULT -420
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID;
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_face_matches JSONB := '[]'::jsonb;
  v_ing_matches JSONB := '[]'::jsonb;
  v_nearest_before JSONB := NULL;
  v_nearest_after JSONB := NULL;
BEGIN
  -- Strict auth check
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthorized', 'matches', '[]'::jsonb);
  END IF;

  -- Validasi batas rentang tanggal (max 90 hari sesuai audit ChatGPT)
  IF (p_end_date - p_start_date) > 90 THEN
    RETURN jsonb_build_object('error', 'range_too_large', 'message', 'Rentang tanggal maksimal 90 hari');
  END IF;

  -- Konversi tanggal lokal ke interval UTC half-open [v_start, v_end)
  -- Default WIB = -420 menit (UTC+7)
  v_start := (p_start_date::timestamp - (COALESCE(p_tz_offset_minutes, -420) || ' minutes')::interval) AT TIME ZONE 'UTC';
  v_end   := (p_end_date::timestamp + interval '1 day' - (COALESCE(p_tz_offset_minutes, -420) || ' minutes')::interval) AT TIME ZONE 'UTC';

  -- 1. Cari Face Scans pada rentang tanggal
  SELECT COALESCE(jsonb_agg(f_row), '[]'::jsonb)
  INTO v_face_matches
  FROM (
    SELECT jsonb_build_object(
      'id', fs.id,
      'scanned_at', fs.created_at,
      'local_date', (fs.created_at AT TIME ZONE 'Asia/Jakarta')::date,
      'capture_hour', EXTRACT(HOUR FROM (fs.created_at AT TIME ZONE 'Asia/Jakarta')),
      'overall_score', fs.overall_score,
      'skin_type', fs.skin_type,
      'skin_status_title', fs.skin_status_title,
      'skin_concerns', fs.skin_concerns,
      'hero_actives', fs.product_recommendations,
      'is_repeat', COALESCE(fs.is_repeat, false),
      'area_evaluations', fs.area_evaluations
    ) AS f_row
    FROM public.face_scans fs
    WHERE fs.user_id = v_uid
      AND fs.created_at >= v_start
      AND fs.created_at < v_end
    ORDER BY fs.created_at DESC
  ) sub_face;

  -- 2. Cari Ingredient Scans pada rentang tanggal
  SELECT COALESCE(jsonb_agg(i_row), '[]'::jsonb)
  INTO v_ing_matches
  FROM (
    SELECT jsonb_build_object(
      'id', ings.id,
      'scanned_at', ings.created_at,
      'local_date', (ings.created_at AT TIME ZONE 'Asia/Jakarta')::date,
      'product_name', ings.product_name,
      'brand', ings.brand,
      'safety_score', ings.safety_score,
      'is_safe', ings.is_safe,
      'key_ingredients', ings.key_ingredients,
      'matched_concerns', ings.matched_concerns
    ) AS i_row
    FROM public.ingredient_scans ings
    WHERE ings.user_id = v_uid
      AND ings.created_at >= v_start
      AND ings.created_at < v_end
    ORDER BY ings.created_at DESC
  ) sub_ing;

  -- 3. Jika tidak ada scan yang cocok (matches kosong), cari nearest_before & nearest_after (Kimi & ChatGPT consensus)
  IF jsonb_array_length(v_face_matches) = 0 THEN
    -- Nearest before
    SELECT jsonb_build_object(
      'id', fs.id,
      'local_date', (fs.created_at AT TIME ZONE 'Asia/Jakarta')::date,
      'overall_score', fs.overall_score,
      'skin_status_title', fs.skin_status_title
    )
    INTO v_nearest_before
    FROM public.face_scans fs
    WHERE fs.user_id = v_uid AND fs.created_at < v_start
    ORDER BY fs.created_at DESC
    LIMIT 1;

    -- Nearest after
    SELECT jsonb_build_object(
      'id', fs.id,
      'local_date', (fs.created_at AT TIME ZONE 'Asia/Jakarta')::date,
      'overall_score', fs.overall_score,
      'skin_status_title', fs.skin_status_title
    )
    INTO v_nearest_after
    FROM public.face_scans fs
    WHERE fs.user_id = v_uid AND fs.created_at >= v_end
    ORDER BY fs.created_at ASC
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'requested_start', p_start_date,
    'requested_end', p_end_date,
    'has_matches', (jsonb_array_length(v_face_matches) > 0 OR jsonb_array_length(v_ing_matches) > 0),
    'face_scans', v_face_matches,
    'ingredient_scans', v_ing_matches,
    'nearest_before', v_nearest_before,
    'nearest_after', v_nearest_after
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_chatbot_scans_by_period(DATE, DATE, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chatbot_scans_by_period(DATE, DATE, INT) TO authenticated, service_role;

-- 5. Update RPC: get_chatbot_user_context() with Timeline Index & Handbook Knowledge
CREATE OR REPLACE FUNCTION public.get_chatbot_user_context()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID;
  v_master_consent BOOLEAN;
  v_face_consent BOOLEAN;
  v_prod_consent BOOLEAN;
  v_profile JSONB;
  v_face_scan JSONB := NULL;
  v_ingredient_scans JSONB := '[]'::jsonb;
  v_timeline_index JSONB := '[]'::jsonb;
  v_handbook_knowledge JSONB := '[]'::jsonb;
BEGIN
  -- 1. Ambil ID pengguna terverifikasi dari token JWT
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', false,
      'master_consented', false,
      'face_scan', NULL,
      'ingredient_scans', '[]'::jsonb,
      'timeline_index', '[]'::jsonb,
      'handbook_knowledge', '[]'::jsonb
    );
  END IF;

  -- 2. Ambil ringkasan Product Handbook (selalu tersedia untuk cegah halusinasi fitur)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', canonical_name,
        'aliases', aliases,
        'category', category,
        'description', description,
        'what_it_is_not', what_it_is_not
      )
    ),
    '[]'::jsonb
  )
  INTO v_handbook_knowledge
  FROM public.skincluv_handbook
  WHERE is_published = true;

  -- 3. Baca status consent dari public.profiles
  SELECT
    chatbot_scan_master_consent,
    COALESCE(chatbot_face_scan_consent, true),
    COALESCE(chatbot_product_scan_consent, true),
    jsonb_build_object(
      'username', username,
      'full_name', full_name
    )
  INTO
    v_master_consent,
    v_face_consent,
    v_prod_consent,
    v_profile
  FROM public.profiles
  WHERE id = v_uid;

  -- Jika master consent tidak TRUE (FALSE atau NULL), kembalikan zero context (Zero-Query Policy)
  IF v_master_consent IS NOT TRUE THEN
    RETURN jsonb_build_object(
      'authenticated', true,
      'master_consented', false,
      'face_consented', v_face_consent,
      'product_consented', v_prod_consent,
      'profile', v_profile,
      'face_scan', NULL,
      'ingredient_scans', '[]'::jsonb,
      'timeline_index', '[]'::jsonb,
      'handbook_knowledge', v_handbook_knowledge
    );
  END IF;

  -- 4. Ambil rekam jejak Face Scan terbaru jika consent wajah aktif
  IF v_face_consent IS TRUE THEN
    SELECT jsonb_build_object(
      'id', fs.id,
      'scanned_at', fs.created_at,
      'age_hours', ROUND(EXTRACT(EPOCH FROM (now() - fs.created_at)) / 3600),
      'is_stale_14d', ((now() - fs.created_at) > interval '14 days'),
      'overall_score', fs.overall_score,
      'skin_type', fs.skin_type,
      'skin_status_title', fs.skin_status_title,
      'skin_concerns', fs.skin_concerns,
      'hero_actives', fs.product_recommendations,
      'area_evaluations', fs.area_evaluations,
      'is_repeat', COALESCE(fs.is_repeat, false),
      'capture_hour', EXTRACT(HOUR FROM (fs.created_at AT TIME ZONE 'Asia/Jakarta'))
    )
    INTO v_face_scan
    FROM public.face_scans fs
    WHERE fs.user_id = v_uid
    ORDER BY fs.created_at DESC
    LIMIT 1;

    -- Ambil Timeline Index 5 Face Scan terakhir (~30 token) sesuai konsensus DeepSeek & Kimi
    SELECT COALESCE(jsonb_agg(t_row), '[]'::jsonb)
    INTO v_timeline_index
    FROM (
      SELECT jsonb_build_object(
        'id', fs.id,
        'date', (fs.created_at AT TIME ZONE 'Asia/Jakarta')::date,
        'score', fs.overall_score,
        'status', fs.skin_status_title,
        'is_repeat', COALESCE(fs.is_repeat, false),
        'capture_hour', EXTRACT(HOUR FROM (fs.created_at AT TIME ZONE 'Asia/Jakarta'))
      ) AS t_row
      FROM public.face_scans fs
      WHERE fs.user_id = v_uid
      ORDER BY fs.created_at DESC
      LIMIT 5
    ) sub_timeline;
  END IF;

  -- 5. Ambil 3 rekam jejak Ingredient Scan terbaru jika consent produk aktif
  IF v_prod_consent IS TRUE THEN
    SELECT COALESCE(jsonb_agg(prod_row), '[]'::jsonb)
    INTO v_ingredient_scans
    FROM (
      SELECT jsonb_build_object(
        'id', ings.id,
        'scanned_at', ings.created_at,
        'local_date', (ings.created_at AT TIME ZONE 'Asia/Jakarta')::date,
        'product_name', ings.product_name,
        'brand', ings.brand,
        'safety_score', ings.safety_score,
        'is_safe', ings.is_safe,
        'key_ingredients', ings.key_ingredients,
        'matched_concerns', ings.matched_concerns
      ) AS prod_row
      FROM public.ingredient_scans ings
      WHERE ings.user_id = v_uid
      ORDER BY ings.created_at DESC
      LIMIT 3
    ) sub;
  END IF;

  -- 6. Kembalikan canonical context aman
  RETURN jsonb_build_object(
    'authenticated', true,
    'master_consented', true,
    'face_consented', v_face_consent,
    'product_consented', v_prod_consent,
    'profile', v_profile,
    'face_scan', v_face_scan,
    'ingredient_scans', v_ingredient_scans,
    'timeline_index', v_timeline_index,
    'handbook_knowledge', v_handbook_knowledge
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_chatbot_user_context() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chatbot_user_context() TO authenticated, service_role;
