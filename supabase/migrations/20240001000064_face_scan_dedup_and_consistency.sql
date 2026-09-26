-- ============================================================
-- Migration 064: Face Scan Determinism, Image Hash Caching & Clinical Consistency (RFC 011)
-- 1. Add image_content_hash, analysis_version, is_repeat to public.face_scans
-- 2. Index for sub-millisecond deduplication lookup
-- 3. Update get_user_dashboard_summary to exclude is_repeat = true from baseline
-- 4. Tune model_configs for face_analysis to temperature 0.0 & seed 42
-- ============================================================

-- 1. Tambah kolom deduplikasi & versioning pada public.face_scans
ALTER TABLE public.face_scans
  ADD COLUMN IF NOT EXISTS image_content_hash TEXT,
  ADD COLUMN IF NOT EXISTS analysis_version TEXT NOT NULL DEFAULT 'face-v4',
  ADD COLUMN IF NOT EXISTS is_repeat BOOLEAN NOT NULL DEFAULT false;

-- 2. Indeks komposit cepat untuk lookup cache per user
CREATE INDEX IF NOT EXISTS idx_face_scans_dedup
  ON public.face_scans (user_id, image_content_hash, analysis_version, created_at DESC)
  WHERE image_content_hash IS NOT NULL;

-- 3. Perbarui get_user_dashboard_summary agar mem-filter is_repeat = false
-- Mencegah pencemaran baseline tren klinis oleh data duplikat/cache
CREATE OR REPLACE FUNCTION public.get_user_dashboard_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile jsonb;
  v_face_latest record;
  v_baseline_score numeric;
  v_delta_score integer := NULL;
  v_can_show_delta boolean := false;
  v_trend_direction text := 'none';
  v_trend_label text := 'Belum ada data';
  v_face_count integer := 0;
  v_ingredient_count integer := 0;
  v_product_summary jsonb;
  v_missions_completed integer := 0;
  v_missions_total integer := 0;
  v_recent_scans jsonb := '[]'::jsonb;
  v_active_missions jsonb := '[]'::jsonb;
  v_skin_assessment jsonb;
  v_result jsonb;
BEGIN
  -- Strict Zero-IDOR authentication check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- 1. Profil Kulit Terakhir
  SELECT to_jsonb(p) INTO v_profile FROM (
    SELECT skin_type, skin_concerns, analysis_notes
    FROM public.skin_profiles
    WHERE user_id = v_user_id AND is_active = true
    LIMIT 1
  ) p;

  -- 2. Hitung total scan (hanya scan unik/asli, bukan repeat)
  SELECT count(*) INTO v_face_count 
  FROM public.face_scans 
  WHERE user_id = v_user_id AND is_repeat = false;

  SELECT count(*) INTO v_ingredient_count 
  FROM public.ingredient_scans 
  WHERE user_id = v_user_id;

  -- 3. Ambil Face Scan Terkini
  SELECT id, overall_score, skin_status_title, skin_type, analysis_notes, created_at
  INTO v_face_latest
  FROM public.face_scans
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- 4. Hitung Delta Klinis Berbasis Median Baseline (Kimi Consensus RFC 008 & RFC 011)
  -- Eksklusi scan berulang (is_repeat = true) agar tren tidak tercemar
  IF v_face_latest.id IS NOT NULL THEN
    IF v_face_count >= 2 THEN
      SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY overall_score)
      INTO v_baseline_score
      FROM (
        SELECT overall_score
        FROM public.face_scans
        WHERE user_id = v_user_id
          AND is_repeat = false
          AND id <> v_face_latest.id
          AND created_at >= (v_face_latest.created_at - interval '28 days')
        ORDER BY created_at DESC
        LIMIT 10
      ) sub;

      IF v_baseline_score IS NOT NULL THEN
        v_delta_score := round(v_face_latest.overall_score - v_baseline_score);
        v_can_show_delta := true;

        IF v_delta_score >= 5 THEN
          v_trend_direction := 'improving';
          v_trend_label := 'Kondisi membaik';
        ELSIF v_delta_score <= -5 THEN
          v_trend_direction := 'attention';
          v_trend_label := 'Perlu perhatian';
        ELSE
          v_trend_direction := 'stable';
          v_trend_label := 'Kondisi stabil';
        END IF;
      END IF;
    END IF;
  END IF;

  -- 5. Ringkasan Produk Rekomendasi
  SELECT jsonb_build_object(
    'total_recommended', count(*),
    'essential_count', count(*) FILTER (WHERE priority = 'essential'),
    'last_updated', max(created_at)
  )
  INTO v_product_summary
  FROM public.product_recommendations
  WHERE user_id = v_user_id;

  -- 6. Misi Aktif & Streak
  SELECT 
    count(*) FILTER (WHERE status = 'completed'),
    count(*)
  INTO v_missions_completed, v_missions_total
  FROM public.user_missions
  WHERE user_id = v_user_id;

  -- 7. Gabungkan 5 Scan Wajah & Komposisi Terbaru
  SELECT coalesce(jsonb_agg(scan_item), '[]'::jsonb)
  INTO v_recent_scans
  FROM (
    (
      SELECT 
        id,
        'face' AS scan_type,
        overall_score AS score,
        skin_status_title AS title,
        skin_type AS subtitle,
        created_at,
        is_repeat
      FROM public.face_scans
      WHERE user_id = v_user_id
      ORDER BY created_at DESC
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 
        id,
        'ingredient' AS scan_type,
        safety_score AS score,
        product_name AS title,
        brand AS subtitle,
        created_at,
        false AS is_repeat
      FROM public.ingredient_scans
      WHERE user_id = v_user_id
      ORDER BY created_at DESC
      LIMIT 3
    )
    ORDER BY created_at DESC
    LIMIT 5
  ) scan_item;

  -- 8. Susun DTO JSON Final
  v_result := jsonb_build_object(
    'profile', v_profile,
    'face_latest', CASE WHEN v_face_latest.id IS NOT NULL THEN
      jsonb_build_object(
        'id', v_face_latest.id,
        'overall_score', v_face_latest.overall_score,
        'skin_status_title', v_face_latest.skin_status_title,
        'skin_type', v_face_latest.skin_type,
        'analysis_notes', v_face_latest.analysis_notes,
        'created_at', v_face_latest.created_at
      )
    ELSE NULL END,
    'clinical_delta', jsonb_build_object(
      'delta_score', v_delta_score,
      'can_show_delta', v_can_show_delta,
      'trend_direction', v_trend_direction,
      'trend_label', v_trend_label,
      'baseline_score', v_baseline_score
    ),
    'stats', jsonb_build_object(
      'face_count', v_face_count,
      'ingredient_count', v_ingredient_count,
      'missions_completed', v_missions_completed,
      'missions_total', v_missions_total
    ),
    'product_summary', v_product_summary,
    'recent_scans', v_recent_scans
  );

  RETURN v_result;
END;
$$;

-- 4. Update model_configs untuk face_analysis: temperature 0.0 & seed 42
-- Memangkas variansi stokastis pada model penalaran multimodal
UPDATE public.model_configs
SET parameters = jsonb_build_object(
  'temperature', 0.0,
  'top_p', 1.0,
  'seed', 42,
  'max_tokens', 8192,
  'response_mime_type', 'application/json'
)
WHERE feature_id IN (
  SELECT id FROM public.ai_features WHERE slug = 'face_analysis'
);
