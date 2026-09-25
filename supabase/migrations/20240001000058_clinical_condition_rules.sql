-- ==============================================================================
-- Migration 058: Clinical Condition Rules (Deterministic Safety Engine)
-- RFC 006 Clinical Council (Kimi / Moonshot & ChatGPT Red Team)
-- Principle: "Zero hallucination — clinical risks are governed by deterministic DB tables"
-- ==============================================================================

-- 1. Tabel clinical_condition_rules
CREATE TABLE IF NOT EXISTS public.clinical_condition_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition_flag TEXT NOT NULL,         -- e.g. barrier_compromised, active_acne_inflamed, rosacea_suspected, all_conditions
    ingredient_category TEXT NOT NULL,    -- e.g. Exfoliant-AHA, Exfoliant-BHA, Retinoid, Vitamin-C-pure, Alcohol-Denat
    severity TEXT NOT NULL CHECK (severity IN ('forbidden_absolute', 'forbidden_temporarily', 'caution')),
    risk_title TEXT NOT NULL,
    clinical_rationale TEXT NOT NULL,
    safe_alternative TEXT,
    source_ref TEXT DEFAULT 'Konsensus Dermatologi & Regulasi Kosmetik BPOM',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index & Unique Constraint pasangan (Case-Insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinical_condition_pair_unique
    ON public.clinical_condition_rules (lower(trim(condition_flag)), lower(trim(ingredient_category)));

CREATE INDEX IF NOT EXISTS idx_clinical_condition_flag
    ON public.clinical_condition_rules (condition_flag);

CREATE INDEX IF NOT EXISTS idx_clinical_ingredient_category
    ON public.clinical_condition_rules (ingredient_category);

CREATE INDEX IF NOT EXISTS idx_clinical_severity
    ON public.clinical_condition_rules (severity);

-- RLS
ALTER TABLE public.clinical_condition_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinical_condition_rules_select_all" ON public.clinical_condition_rules;
CREATE POLICY "clinical_condition_rules_select_all"
    ON public.clinical_condition_rules FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "clinical_condition_rules_admin_all" ON public.clinical_condition_rules;
CREATE POLICY "clinical_condition_rules_admin_all"
    ON public.clinical_condition_rules FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Seed 15 Aturan Klinis Konsensus Dermatologi Terverifikasi
INSERT INTO public.clinical_condition_rules 
    (condition_flag, ingredient_category, severity, risk_title, clinical_rationale, safe_alternative, source_ref)
VALUES
    (
        'barrier_compromised',
        'Exfoliant-AHA',
        'forbidden_temporarily',
        'Kontraindikasi: Kerusakan Barrier vs AHA',
        'Asam eksfoliator alfa hidroksi (seperti Glycolic Acid, Lactic Acid) pada stratum korneum yang rusak memperparah transepidermal water loss (TEWL) dan memicu eritema parah serta sensasi terbakar.',
        'Hentikan sementara AHA. Gunakan Ceramide, Panthenol (Pro-Vitamin B5), atau Hyaluronic Acid hingga sawar kulit pulih (2-4 minggu).',
        'Journal of Investigative Dermatology & Guideline Dermatologi Kosmetik'
    ),
    (
        'barrier_compromised',
        'Exfoliant-BHA',
        'forbidden_temporarily',
        'Kontraindikasi: Kerusakan Barrier vs BHA',
        'Asam salisilat bersifat keratolitik dan desmolitik kuat. Saat lipid barrier menipis dan meradang, BHA dapat memicu deskuamasi berlebih dan iritasi akut.',
        'Alihkan ke bahan penenang anti-inflamasi: Centella Asiatica, Allantoin, atau Niacinamide konsentrasi rendah (2-4%).',
        'Clinical, Cosmetic and Investigational Dermatology'
    ),
    (
        'barrier_compromised',
        'Retinoid',
        'forbidden_temporarily',
        'Kontraindikasi: Kerusakan Barrier vs Retinoid',
        'Retinoid (Retinol, Retinal, HPR) meningkatkan laju pergantian seluler epidermal secara drastis, berisiko tinggi memicu retinoid dermatitis pada kulit yang sawarnya sedang rusak.',
        'Tunda penggunaan retinoid. Fokus pada pelembap perbaikan sawar kulit (Ceramide Complex 3:1:1:1) minimal 14 hari sebelum re-introduksi.',
        'American Academy of Dermatology (AAD)'
    ),
    (
        'barrier_compromised',
        'Vitamin-C-pure',
        'forbidden_temporarily',
        'Peringatan: Kerusakan Barrier vs Vitamin C Asam',
        'L-Ascorbic Acid murni memerlukan formulasi pH sangat rendah (<3.5) yang bersifat asam iritatif tinggi pada sawar kulit yang terganggu.',
        'Gunakan turunan Vitamin C stabil ramah pH netral (Sodium Ascorbyl Phosphate) atau Niacinamide.',
        'Dermatologic Surgery Review'
    ),
    (
        'barrier_compromised',
        'Alcohol-Denat',
        'forbidden_temporarily',
        'Peringatan: Barrier Rusak vs Alkohol Sederhana',
        'Alkohol terdenaturasi (Alcohol Denat, SD Alcohol, Isopropyl Alcohol) konsentrasi tinggi melarutkan matriks lipid interseluler alami pelindung kulit.',
        'Gunakan toner hidrasi bebas alkohol (alcohol-free) dengan ekstrak oat atau beta-glucan.',
        'Cosmetic Ingredient Review (CIR)'
    ),
    (
        'barrier_compromised',
        'Fragrance-EssentialOil',
        'forbidden_temporarily',
        'Peringatan: Barrier Rusak vs Pewangi / Minyak Esensial',
        'Minyak esensial (seperti citrus oil, lavender, eucalyptus) dan pewangi sintetis mengandung alergen volatil yang sangat mudah menembus sawar rusak dan memicu dermatitis kontak alergi.',
        'Pilih produk berlabel fragrance-free dan tersertifikasi ramah kulit sensitif.',
        'Contact Dermatitis Journal'
    ),
    (
        'active_acne_inflamed',
        'Occlusive-Heavy',
        'caution',
        'Perhatian: Jerawat Meradang vs Bahan Oklusif Berat',
        'Bahan oklusif tebal dengan skala komedogenik tinggi (skala 4-5 seperti Isopropyl Myristate, Coconut Oil, atau Wax berat) dapat menyumbat muara pori dan memerangkap koloni bakteri C. acnes.',
        'Gunakan pelembap bertekstur gel/lotion berbahan dasar air (water-based) berlabel non-comedogenic.',
        'Journal of Clinical and Aesthetic Dermatology'
    ),
    (
        'active_acne_inflamed',
        'Physical-Scrub',
        'forbidden_temporarily',
        'Larangan: Jerawat Aktif vs Butiran Scrub Kasar',
        'Scrub fisik dengan partikel kasar berisiko memecahkan papula/pustula jerawat, memicu luka mikro, penyebaran infeksi bakteri, dan bekas hiperpigmentasi pasca inflamasi (PIH).',
        'Hindari gesekan mekanik. Bersihkan wajah dengan pembersih bertekstur lembut tanpa butiran scrub.',
        'Perhimpunan Dokter Spesialis Kulit dan Kelamin Indonesia (PERDOSKI)'
    ),
    (
        'hyperpigmentation_active',
        'Photosensitizing-Active',
        'caution',
        'Peringatan Penting: Agen Aktif Fotosensitif vs Melasma / PIH',
        'Zat aktif peningkat pergantian sel seperti konsentrasi AHA tinggi atau Retinoid meningkatkan sensitivitas kulit terhadap radiasi sinar UV, yang berisiko mempergelap bercak flek hitam jika tidak dilindungi.',
        'Wajib aplikasikan Tabir Surya (Sunscreen) broad-spectrum minimal SPF 35 PA++++ setiap pagi dan reapply teratur.',
        'British Journal of Dermatology'
    ),
    (
        'rosacea_suspected',
        'Benzoyl-Peroxide',
        'forbidden_temporarily',
        'Kontraindikasi: Rosacea / Eritema vs Benzoyl Peroxide',
        'Benzoyl Peroxide memicu stres oksidatif pelepasan radikal bebas oksigen yang dapat mengiritasi pembuluh darah mikrosirkulasi kulit penderita rosacea.',
        'Gunakan alternatif ramah vaskular seperti Azelaic Acid 10% atau ekstrak Licorice / Centella.',
        'National Rosacea Society Expert Panel'
    ),
    (
        'rosacea_suspected',
        'Physical-Scrub',
        'forbidden_temporarily',
        'Larangan Keras: Rosacea vs Eksfoliasi Fisik',
        'Friksi dan abrasi fisik memicu pelepasan histamin dan vasodilatasi vaskular wajah, menyebabkan eritema persisten dan sensasi terbakar yang bertahan berhari-hari.',
        'Hindari spons kasar, brush, atau scrub. Cukup gunakan telapak tangan dengan pembersih non-foaming lembut.',
        'International Journal of Dermatology'
    ),
    (
        'sensitive_reactive',
        'High-Fragrance',
        'caution',
        'Peringatan: Kulit Reaktif vs Pewangi Konsentrasi Tinggi',
        'Aroma buatan konsentrasi tinggi merupakan salah satu pemicu utama dermatitis kontak iritan pada kulit reaktif hiper-responsif.',
        'Prioritaskan produk hypoallergenic tanpa parfum tambahan (fragrance-free).',
        'Dermatitis Society Guidelines'
    ),
    (
        'all_conditions',
        'Drug-Illegal-Substance',
        'forbidden_absolute',
        'BAHAYA ABSOLUT: Bahan Terlarang / Obat Keras Ilegal',
        'Bahan kimia berbahaya yang dilarang BPOM (seperti Merkuri, Hidrokuinon tanpa resep dokter, atau Steroid topikal bebas) dapat menyebabkan okronosis eksogen, atrofi jaringan kulit, dan kerusakan organ internal permanen.',
        'HENTIKAN PEMAKAIAN SEGERA. Buang produk ini dan segera periksakan kondisi kulit ke dokter spesialis dermatologi terdekat.',
        'Peraturan Badan Pengawas Obat dan Makanan (BPOM RI)'
    ),
    (
        'barrier_compromised',
        'Physical-Scrub',
        'forbidden_temporarily',
        'Larangan Keras: Barrier Rusak vs Scrub Fisik',
        'Lapisan tanduk kulit yang sedang merekah akan semakin menipis jika terkikis partikel mekanik kasar, memperluas celah infeksi bakteri sekunder.',
        'Cukup bilas wajah menggunakan air suam kuku dan sabun pembersih ber-pH fisiologis seimbang (5.0 - 5.5).',
        'Acta Dermato-Venereologica'
    ),
    (
        'active_acne_inflamed',
        'Steroid-Topical',
        'forbidden_absolute',
        'Bahaya Kritis: Jerawat vs Salep Kortikosteroid Tanpa Resep',
        'Kortikosteroid menekan kekebalan lokal kulit secara semu, memicu erupsi jerawat steroid (steroid-induced acne) yang jauh lebih meradang dan kebal pengobatan.',
        'Jangan gunakan salep kortikosteroid untuk jerawat. Gunakan terapi terstandar medis (seperti BHA, Tea Tree, Sulfur, atau konsultasi dokter Sp.DVE).',
        'Clinical and Experimental Dermatology'
    )
ON CONFLICT (lower(trim(condition_flag)), lower(trim(ingredient_category)))
DO UPDATE SET
    severity = EXCLUDED.severity,
    risk_title = EXCLUDED.risk_title,
    clinical_rationale = EXCLUDED.clinical_rationale,
    safe_alternative = EXCLUDED.safe_alternative,
    source_ref = EXCLUDED.source_ref,
    is_active = true,
    updated_at = now();
