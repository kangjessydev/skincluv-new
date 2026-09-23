-- ==============================================================================
-- Migration 050: Clinical Skincare Knowledge Base & BPOM Regulatory Hardening
-- Auditor: Kimi / Moonshot (RFC 004)
-- Lead Engineer: Antigravity
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table: public.ingredient_interactions (Zero-Hallucination Contraindication Matrix)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ingredient_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_a TEXT NOT NULL,
    ingredient_b TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('fatal', 'caution', 'synergistic')),
    risk_title TEXT NOT NULL,
    risk_description TEXT NOT NULL,
    clinical_action TEXT NOT NULL,
    bpom_warning TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index dan Unique Constraint dua arah (Case-Insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ingredient_interactions_pair_unique
    ON public.ingredient_interactions (
        LEAST(lower(trim(ingredient_a)), lower(trim(ingredient_b))),
        GREATEST(lower(trim(ingredient_a)), lower(trim(ingredient_b)))
    );

CREATE INDEX IF NOT EXISTS idx_ingredient_interactions_severity
    ON public.ingredient_interactions (severity);

-- RLS
ALTER TABLE public.ingredient_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ingredient_interactions_select_all" ON public.ingredient_interactions;
CREATE POLICY "ingredient_interactions_select_all"
    ON public.ingredient_interactions FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "ingredient_interactions_admin_all" ON public.ingredient_interactions;
CREATE POLICY "ingredient_interactions_admin_all"
    ON public.ingredient_interactions FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. Extend public.skincare_ingredients with BPOM Regulatory Columns
-- ------------------------------------------------------------------------------
ALTER TABLE public.skincare_ingredients
    ADD COLUMN IF NOT EXISTS is_drug_only BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_banned_substance BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS photosensitizing BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS pregnancy_safe BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS usage_time TEXT DEFAULT 'both' CHECK (usage_time IN ('am', 'pm', 'both'));

CREATE INDEX IF NOT EXISTS idx_skincare_ingredients_banned
    ON public.skincare_ingredients (is_banned_substance) WHERE is_banned_substance = true;

CREATE INDEX IF NOT EXISTS idx_skincare_ingredients_drug_only
    ON public.skincare_ingredients (is_drug_only) WHERE is_drug_only = true;

-- ------------------------------------------------------------------------------
-- 3. Seed: 8 Matriks Kontraindikasi Fatal & Sinergi Kimi (RFC 004)
-- ------------------------------------------------------------------------------
INSERT INTO public.ingredient_interactions (
    ingredient_a,
    ingredient_b,
    severity,
    risk_title,
    risk_description,
    clinical_action,
    bpom_warning
) VALUES
(
    'Retinoid',
    'AHA',
    'fatal',
    'Kerusakan Skin Barrier Berat & Chemical Burn',
    'Penggunaan simultan Retinoid dengan AHA konsentrasi tinggi menurunkan toleransi stratum korneum secara drastis, memicu eritema akut, pengelupasan berlebih, dan rasa terbakar.',
    'Pisahkan malam bergantian (selang hari: Malam 1 Retinoid, Malam 2 Istirahat/Hydrating, Malam 3 AHA). Wajib gunakan pelembap kaya ceramide.',
    'Gunakan hanya kosmetik yang terdaftar BPOM dan hindari mencampur produk eksfoliasi berkonsentrasi tinggi tanpa pengawasan dermatolog.'
),
(
    'Benzoyl Peroxide',
    'Tretinoin',
    'fatal',
    'Inaktivasi Formula & Iritasi Parah',
    'Benzoyl Peroxide adalah agen pengoksidasi kuat yang mengoksidasi dan menghancurkan molekul Tretinoin secara instan, membuat Tretinoin inaktif sekaligus menggandakan potensi iritasi kulit.',
    'Gunakan Benzoyl Peroxide pada pagi hari dan Tretinoin pada malam hari. Jangan dilayer bersamaan kecuali dalam formulasi fixed-dose khusus yang terenkapsulasi.',
    'Tretinoin adalah obat keras yang wajib dengan resep dokter menurut regulasi BPOM RI.'
),
(
    'Benzoyl Peroxide',
    'Hydroquinone',
    'fatal',
    'Risiko Pewarnaan Gelap / Ochronosis Eksogen',
    'Interaksi kimia antara Benzoyl Peroxide dan Hydroquinone dapat menyebabkan pewarnaan gelap sementara yang pekat pada kulit (staining) dan meningkatkan risiko kerusakan pigmen permanen (Ochronosis Eksogen).',
    'Dilarang keras melayer kedua bahan ini. Jika sedang dalam terapi, konsultasikan jadwal pemisahan dengan dokter spesialis kulit.',
    'Hydroquinone dilarang keras dalam kosmetik bebas oleh BPOM RI (PerBPOM No. 17/2022) dan hanya boleh digunakan atas resep dokter.'
),
(
    'AHA',
    'BHA',
    'fatal',
    'Penurunan pH Ekstrem & Barrier Burn',
    'Menggabungkan AHA dan BHA konsentrasi tinggi secara bersamaan dapat menyebabkan penurunan pH kulit yang terlalu asam (< 3.0), mengikis lipid interselular dan memicu dermatitis kontak iritan.',
    'Pilih salah satu sesuai kebutuhan (BHA untuk pori/minyak, AHA untuk tekstur/flek), atau gunakan selang hari. Jangan tumpuk serum AHA di atas serum BHA.',
    'Patuhi batas kadar aman BPOM (AHA maks 10%, BHA maks 2% untuk kosmetik bebas penggunaan mandiri).'
),
(
    'Vitamin C (L-Ascorbic Acid)',
    'Copper Peptide',
    'fatal',
    'Oksidasi Ion Tembaga & Hilangnya Manfaat',
    'L-Ascorbic Acid (Vitamin C murni) mengkelat dan mengoksidasi ion tembaga pada Copper Peptide. Akibatnya, peptide terurai inaktif dan Vitamin C teroksidasi cepat menjadi dehidroaskorbat.',
    'Gunakan Vitamin C pada pagi hari (sebagai antioksidan pendamping sunscreen) dan Copper Peptide pada malam hari untuk regenerasi kolagen.',
    NULL
),
(
    'Eksfoliator Kimia (AHA/BHA/Retinoid)',
    'Physical Scrub',
    'fatal',
    'Luka Mikro (Micro-Tears) & Hiperpigmentasi Pasca-Inflamasi (PIH)',
    'Kombinasi eksfoliasi kimia yang melonggarkan ikatan korneosit ditambah gesekan partikel fisik scrub menyebabkan luka mikro tak kasat mata, peradangan hebat, dan memicu flek hitam pasca-inflamasi.',
    'Hentikan penggunaan scrub fisik berbutir kasar saat menggunakan bahan aktif retinoid atau asam eksfoliasi. Cukup gunakan pembersih wajah berbusa lembut.',
    NULL
),
(
    'Retinoid / AHA',
    'Tanpa Sunscreen (No SPF)',
    'fatal',
    'Fotosensitivitas Tinggi & Pembentukan Flek Hitam Baru',
    'Retinoid dan AHA menipiskan lapisan sel mati terluar dan meningkatkan fotosensitivitas kulit terhadap radiasi UVA/UVB hingga 200%, mempercepat photo-aging dan memicu melasma jika terpapar sinar matahari.',
    'Wajib menggunakan Sunscreen broad-spectrum minimal SPF 30 / PA+++ setiap pagi dan reapply setiap 2-3 jam saat berada di luar ruangan.',
    'Peringatan wajib pada label kosmetik ber-AHA sesuai Keputusan Kepala BPOM: selalu sertakan peringatan wajib pemakaian tabir surya.'
),
(
    'Vitamin C Murni',
    'Niacinamide',
    'synergistic',
    'Kombinasi Sinergis Modern (Aman Dilayer)',
    'Mitos bahwa Vit C dan Niacinamide menghasilkan racun/asam nikotinat berasal dari riset lama era 1960-an dalam kondisi suhu ekstrem (>100°C). Pada formulasi modern di suhu ruangan, keduanya bekerja sinergis mencerahkan kulit dari dua jalur biokimia berbeda.',
    'Boleh digunakan bersamaan atau berlapis. Jika memiliki kulit sangat sensitif dan rentan kemerahan, beri jeda 3-5 menit antara aplikasi serum.',
    NULL
)
ON CONFLICT (LEAST(lower(trim(ingredient_a)), lower(trim(ingredient_b))), GREATEST(lower(trim(ingredient_a)), lower(trim(ingredient_b))))
DO UPDATE SET
    severity = EXCLUDED.severity,
    risk_title = EXCLUDED.risk_title,
    risk_description = EXCLUDED.risk_description,
    clinical_action = EXCLUDED.clinical_action,
    bpom_warning = EXCLUDED.bpom_warning,
    updated_at = now();

-- ------------------------------------------------------------------------------
-- 4. Seed: Zat Terlarang & Obat Keras Regulasi BPOM RI
-- ------------------------------------------------------------------------------
INSERT INTO public.skincare_ingredients (
    canonical_name,
    inci_name,
    aliases,
    category,
    safety_rating,
    comedogenic_rating,
    description,
    is_drug_only,
    is_banned_substance,
    photosensitizing,
    pregnancy_safe,
    usage_time,
    is_verified
) VALUES
(
    'Merkuri',
    'Mercury',
    ARRAY['Hydrargyrum', 'Ammoniated Mercury', 'Calomel', 'Mercuric Chloride', 'Air Raksa'],
    'Banned Heavy Metal',
    'hindari',
    0,
    'ZAT TERLARANG & BERACUN BPOM RI. Logam berat yang merusak sistem saraf, ginjal, menyebabkan penipisan kulit ekstrem, flek permanen, dan cacat janin.',
    false,
    true,
    false,
    false,
    'both',
    true
),
(
    'Hidrokuinon',
    'Hydroquinone',
    ARRAY['1,4-Benzenediol', 'Quinol', 'HQ'],
    'Depigmenting Agent (Drug Only)',
    'hindari',
    0,
    'OBAT KERAS (Dilarang dalam kosmetik bebas oleh BPOM RI). Penggunaan mandiri berisiko memicu Ochronosis Exogenus (noda hitam kebiruan permanen yang tidak dapat disembuhkan).',
    true,
    false,
    true,
    false,
    'pm',
    true
),
(
    'Asam Retinoat',
    'Retinoic Acid',
    ARRAY['Tretinoin', 'All-Trans Retinoic Acid', 'ATRA'],
    'Retinoid (Drug Only)',
    'hati',
    0,
    'OBAT KERAS (Dilarang dalam kosmetik bebas oleh BPOM RI). Turunan vitamin A berkekuatan sangat tinggi yang bersifat teratogenik (berbahaya bagi janin). Wajib di bawah resep dan pengawasan dokter.',
    true,
    false,
    true,
    false,
    'pm',
    true
),
(
    'Kortikosteroid',
    'Dexamethasone',
    ARRAY['Betamethasone', 'Clobetasol', 'Hydrocortisone', 'Triamcinolone', 'Steroid Topikal'],
    'Corticosteroid (Drug Only)',
    'hindari',
    0,
    'OBAT KERAS (Dilarang keras dalam kosmetik bebas BPOM). Menyebabkan atrofi kulit (penipisan jaringan), telangiektasis (urat merah timbul), jerawat steroid, dan rebound redness parah saat berhenti.',
    true,
    false,
    false,
    false,
    'both',
    true
)
ON CONFLICT (canonical_name)
DO UPDATE SET
    is_drug_only = EXCLUDED.is_drug_only,
    is_banned_substance = EXCLUDED.is_banned_substance,
    photosensitizing = EXCLUDED.photosensitizing,
    pregnancy_safe = EXCLUDED.pregnancy_safe,
    safety_rating = EXCLUDED.safety_rating,
    description = EXCLUDED.description,
    is_verified = true,
    updated_at = now();

-- ------------------------------------------------------------------------------
-- 5. Prompt Version Update: Injeksi Kepatuhan BPOM RI pada ingredient_scan
-- ------------------------------------------------------------------------------
UPDATE public.prompt_versions
SET is_active = false
WHERE feature_id = (SELECT id FROM public.ai_features WHERE slug = 'ingredient_scan')
  AND is_active = true;

INSERT INTO public.prompt_versions (feature_id, system_prompt, notes, is_active)
SELECT
  f.id,
  'Kamu adalah ahli kosmetologi & dermatologi AI terpercaya dari Skincluv dengan persona "Gen Z Pro" (ilmiah, akurat, santai, dan analogi relatable).

Profil kulit pengguna:
- Tipe kulit: {{skin_type}}
- Masalah kulit: {{skin_concerns}}

== ATURAN REGULASI BPOM RI & VALIDASI KLINIS (WAJIB DIIKUTI KETAT) ==

1. FILTER ZAT TERLARANG & OBAT KERAS:
   - Jika terdeteksi bahan terlarang (Merkuri, Calomel, Air Raksa), WAJIB tandai dengan badge "hindari", safety_score = 0, is_safe = false, dan beri peringatan keras: "PRODUK BERBAHAYA ILEGAL BPOM".
   - Jika terdeteksi bahan obat keras tanpa resep (Hidrokuinon, Asam Retinoat/Tretinoin, Dexamethasone/Steroid), tandai dengan badge "hindari", safety_score <= 30, dan jelaskan bahwa bahan ini memerlukan resep dokter spesialis kulit sesuai PerBPOM No. 17/2022.

2. STANDAR KLAIM KOSMETIK (BEBAS OVERCLAIM):
   - Gunakan terminologi kosmetik BPOM:
     * ❌ JANGAN katakan "menghilangkan jerawat total", gunakan "merawat dan menenangkan kulit berjerawat"
     * ❌ JANGAN katakan "menghilangkan kerutan 100%", gunakan "membantu menyamarkan tampilan garis halus"
     * ❌ JANGAN membuat klaim medis instan atau menyembuhkan penyakit kulit kronis.

3. KLASIFIKASI GAMBAR & ANTI-HALUSINASI:
   - Tolak gambar bukan skincare (wajah manusia, hewan, makanan, kartun, produk non-kosmetik).
   - DILARANG KERAS mengarang bahan yang tidak tercetak di foto kemasan. Jika teks pudar/tidak terbaca, set is_readable = false.

4. ATURAN PANJANG OUTPUT PER BAHAN (EFISIENSI TOKEN):
   - Atribut function, skinType, interaction, dan personal WAJIB disertakan HANYA untuk bahan aktif utama (Niacinamide, Retinol, AHA/BHA, Vit C, Ceramide, Peptide, dll) atau bahan yang memiliki badge "hati" / "hindari".
   - Untuk bahan pelarut/pengisi umum (Aqua, Glycerin, Pengental netral), CUKUP tulis name + badge + badgeLabel + comedogenic_score saja.

5. PANDUAN LAYERING (BEST & DANGER COMBOS):
   - Periksa interaksi fatal: Retinoid + AHA, BPO + Tretinoin, BPO + Hidrokuinon, AHA + BHA simultan, Vit C + Copper Peptide, Chemical Exfoliator + Scrub Fisik, Retinoid/AHA tanpa Sunscreen.
   - Cantumkan bahaya klinis dan solusi pemisahannya di danger_combos.

== FORMAT RESPONS ==
Format respon WAJIB JSON murni tanpa markdown:
{
  "is_valid_skincare": boolean,
  "is_readable": boolean,
  "rejection_reason": string | null,
  "rejection_suggestion": string | null,
  "partial_read_warning": string | null,
  "product_name": string,
  "extracted_raw_text": string,
  "safety_score": number | null,
  "comedogenic_rating": "Rendah (0-1)" | "Sedang (2-3)" | "Tinggi (4-5)" | null,
  "clinical_summary": string | null,
  "overall_recommendation": string | null,
  "bpom_alert": string | null,
  "suitable_for_skin_types": string[],
  "total_ingredients": number,
  "safe_count": number,
  "caution_count": number,
  "avoid_count": number,
  "layering_guide": {
    "best_combos": [{ "pair": string, "benefit": string }],
    "danger_combos": [{ "pair": string, "warning": string, "severity": "fatal" | "caution", "clinical_action": string }]
  },
  "ingredients_breakdown": [
    {
      "name": string,
      "badge": "aman" | "hati" | "hindari",
      "badgeLabel": "Aman" | "Perlu Perhatian" | "Hindari",
      "comedogenic_score": number,
      "is_drug_or_banned": boolean,
      "function": string,
      "skinType": string,
      "interaction": string,
      "personal": { "ok": boolean, "text": string }
    }
  ]
}',
  'Prompt v5 - Kepatuhan BPOM & Matriks Kontraindikasi Fatal Kimi (RFC 004): Standar klaim bebas overclaim, deteksi zat terlarang/obat keras, dan deterministik danger combos severity.',
  true
FROM public.ai_features f
WHERE f.slug = 'ingredient_scan';
