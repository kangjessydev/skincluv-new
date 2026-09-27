-- ==============================================================================
-- Migration 069: Fix Timezone Calculation in get_chatbot_scans_by_period
-- Resolves temporal query offset error where scans between 00:00 and 14:00 WIB were missed
-- ==============================================================================

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
  -- JavaScript getTimezoneOffset convention: UTC = Local + offset (WIB = -420 menit)
  -- 00:00:00 Local + (-420 minutes) = 17:00:00 (previous day) UTC
  v_start := (p_start_date::timestamp + (COALESCE(p_tz_offset_minutes, -420) || ' minutes')::interval) AT TIME ZONE 'UTC';
  v_end   := (((p_end_date + interval '1 day')::date)::timestamp + (COALESCE(p_tz_offset_minutes, -420) || ' minutes')::interval) AT TIME ZONE 'UTC';

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

GRANT EXECUTE ON FUNCTION public.get_chatbot_scans_by_period(DATE, DATE, INT) TO authenticated, service_role;
