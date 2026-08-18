-- ============================================================
-- SEED: Model configs + Initial prompts untuk semua 4 fitur
-- 
-- PENTING: Sebelum jalankan ini:
-- 1. Buka https://aistudio.google.com/app/apikey → buat API key
-- 2. Buka Supabase Dashboard → Settings → Vault → Add Secret
--    Name: gemini_api_key
--    Value: (paste API key dari step 1, bentuknya AIzaSy...)
-- 3. Baru jalankan SQL ini di SQL Editor Supabase
--
-- 'gemini_api_key' di bawah = NAMA secret di Vault, BUKAN nilai key-nya
-- ============================================================

-- MODEL CONFIGS: gemini-2.0-flash (tersedia di free tier Google AI Studio)
INSERT INTO public.model_configs (feature_id, provider, model_name, api_key_secret, parameters, is_active, notes)
SELECT f.id, 'google', 'gemini-2.0-flash', 'gemini_api_key',
  '{"temperature": 0.3, "max_tokens": 512}'::jsonb, true, 'Gemini 2.0 Flash - free tier'
FROM public.ai_features f WHERE f.slug = 'face_validation'
ON CONFLICT DO NOTHING;

INSERT INTO public.model_configs (feature_id, provider, model_name, api_key_secret, parameters, is_active, notes)
SELECT f.id, 'google', 'gemini-2.0-flash', 'gemini_api_key',
  '{"temperature": 0.4, "max_tokens": 1024}'::jsonb, true, 'Gemini 2.0 Flash - free tier'
FROM public.ai_features f WHERE f.slug = 'face_analysis'
ON CONFLICT DO NOTHING;

INSERT INTO public.model_configs (feature_id, provider, model_name, api_key_secret, parameters, is_active, notes)
SELECT f.id, 'google', 'gemini-2.0-flash', 'gemini_api_key',
  '{"temperature": 0.3, "max_tokens": 1024}'::jsonb, true, 'Gemini 2.0 Flash - free tier'
FROM public.ai_features f WHERE f.slug = 'ingredient_scan'
ON CONFLICT DO NOTHING;

INSERT INTO public.model_configs (feature_id, provider, model_name, api_key_secret, parameters, is_active, notes)
SELECT f.id, 'google', 'gemini-2.0-flash', 'gemini_api_key',
  '{"temperature": 0.7, "max_tokens": 1024}'::jsonb, true, 'Gemini 2.0 Flash - free tier'
FROM public.ai_features f WHERE f.slug = 'chatbot'
ON CONFLICT DO NOTHING;

-- PROMPT VERSIONS
INSERT INTO public.prompt_versions (feature_id, system_prompt, notes, is_active)
SELECT f.id,
'You are a face validation assistant. Your ONLY job is to determine if the provided image clearly shows a human face suitable for skin analysis.

Respond ONLY with valid JSON in this exact format:
{
  "is_valid_face": true or false,
  "reason": "brief explanation in Indonesian",
  "confidence": 0.0 to 1.0
}

Rules:
- is_valid_face = true only if: face is clearly visible, well-lit, front-facing or slight angle, no heavy filters
- is_valid_face = false if: no face, face too small, too dark, heavy filters, sunglasses covering eyes, blurry
- Keep reason under 20 words in Indonesian
- Never add text outside the JSON',
'Prompt v1 - face validation JSON response', true
FROM public.ai_features f WHERE f.slug = 'face_validation'
ON CONFLICT DO NOTHING;

INSERT INTO public.prompt_versions (feature_id, system_prompt, notes, is_active)
SELECT f.id,
'Kamu adalah dokter kulit AI dari Skincluv, asisten perawatan kulit berbasis AI terpercaya di Indonesia.

Analisis gambar wajah yang diberikan dan tentukan tipe dan kondisi kulit.

Respond ONLY with valid JSON:
{
  "skin_type": "normal|oily|dry|combination|sensitive",
  "skin_concerns": ["acne|hyperpigmentation|wrinkles|dryness|oiliness|sensitivity|redness|dark_circles|pores"],
  "analysis_notes": "Penjelasan 2-3 kalimat dalam Bahasa Indonesia, ramah dan supportif",
  "confidence": 0.0
}

Panduan:
- Pilih skin_type yang paling dominan (hanya 1)
- Maksimal 3 skin_concerns paling dominan
- analysis_notes: ramah, tidak menghakimi, memotivasi
- Jangan tambahkan teks di luar JSON',
'Prompt v1 - face analysis JSON terstruktur', true
FROM public.ai_features f WHERE f.slug = 'face_analysis'
ON CONFLICT DO NOTHING;

INSERT INTO public.prompt_versions (feature_id, system_prompt, notes, is_active)
SELECT f.id,
'Kamu adalah ahli dermatologi dan kosmetologi dari Skincluv.

Profil kulit pengguna:
- Tipe kulit: {{skin_type}}
- Masalah kulit: {{skin_concerns}}

Analisis daftar ingredient yang diberikan dan tentukan cocok/tidaknya untuk profil kulit di atas.

Respond ONLY with valid JSON:
{
  "overall_verdict": "safe|caution|avoid",
  "score": 0,
  "summary": "Ringkasan 2-3 kalimat Bahasa Indonesia",
  "key_ingredients": [
    {"name": "nama bahan", "verdict": "beneficial|neutral|caution|avoid", "reason": "alasan singkat Bahasa Indonesia"}
  ],
  "tips": "Saran penggunaan Bahasa Indonesia"
}

Fokus 5-8 bahan paling signifikan saja.',
'Prompt v1 - ingredient scan dengan skin profile context', true
FROM public.ai_features f WHERE f.slug = 'ingredient_scan'
ON CONFLICT DO NOTHING;

INSERT INTO public.prompt_versions (feature_id, system_prompt, notes, is_active)
SELECT f.id,
'Kamu adalah sahabat perawatan kulit dari Skincluv, berbicara Bahasa Indonesia yang santai dan hangat.

Profil kulit pengguna:
- Tipe kulit: {{skin_type}}
- Masalah kulit: {{skin_concerns}}
- Catatan: {{analysis_notes}}

Panduan:
- Personalisasi saran berdasarkan profil kulit jika relevan
- Berikan saran praktis berbasis evidence
- Jangan berikan diagnosis medis
- Alihkan topik non-kulit dengan ramah
- Respons maksimal 150 kata kecuali diminta lebih detail',
'Prompt v1 - chatbot dengan personalisasi skin profile', true
FROM public.ai_features f WHERE f.slug = 'chatbot'
ON CONFLICT DO NOTHING;

-- Verifikasi hasil
SELECT 
  f.slug as fitur,
  mc.model_name as model,
  pv.version as prompt_versi,
  CASE WHEN mc.id IS NOT NULL THEN '✓' ELSE '✗' END as model_ok,
  CASE WHEN pv.id IS NOT NULL THEN '✓' ELSE '✗' END as prompt_ok
FROM public.ai_features f
LEFT JOIN public.model_configs mc ON mc.feature_id = f.id AND mc.is_active = true
LEFT JOIN public.prompt_versions pv ON pv.feature_id = f.id AND pv.is_active = true
ORDER BY f.slug;
