-- ============================================================
-- Migration 082: Restore get_user_dashboard_summary canonical schema (RFC 008 + RFC 011)
--
-- Masalah: Migration 064 mengubah schema output RPC secara breaking:
--   - face_latest / clinical_delta / stats (bukan skin_assessment / scan_counts)
--   - recent_scans pakai scan_type bukan type
--   - product_summary pakai total_recommended bukan total_products_scanned
--
-- Solusi: Kembalikan ke schema Migration 060 yang sudah cocok dengan
-- interface TypeScript DashboardSummaryData, sambil tetap mempertahankan:
--   1. Filter is_repeat = false pada scan count & baseline (RFC 011)
--   2. Field scan_type → type sudah dinormalkan
--   3. Tambah face_trend: 7 face scan terbaru untuk chart tren dashboard
-- ============================================================

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
  v_face_trend jsonb := '[]'::jsonb;
  v_active_missions jsonb := '[]'::jsonb;
  v_skin_assessment jsonb;
  v_result jsonb;
BEGIN
  -- Zero-IDOR authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- 1. Profil Kulit
  SELECT to_jsonb(p) INTO v_profile FROM (
    SELECT skin_type, skin_concerns, analysis_notes
    FROM public.skin_profiles
    WHERE user_id = v_user_id AND is_active = true
    LIMIT 1
  ) p;

  -- 2. Hitung scan unik (is_repeat = false, sesuai RFC 011)
  SELECT count(*) INTO v_face_count
  FROM public.face_scans
  WHERE user_id = v_user_id AND is_repeat = false;

  SELECT count(*) INTO v_ingredient_count
  FROM public.ingredient_scans
  WHERE user_id = v_user_id;

  -- 3. Face scan terkini (termasuk repeat untuk tampilan, bukan baseline)
  SELECT id, overall_score, skin_status_title, skin_type, analysis_notes, created_at
  INTO v_face_latest
  FROM public.face_scans
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- 4. Delta klinis berbasis median baseline 28 hari (RFC 008 + RFC 011)
  -- Eksklusi scan repeat agar tren tidak tercemar (RFC 011 Invarian 9)
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
          v_trend_label := 'Perlu perhatian ekstra';
        ELSE
          v_trend_direction := 'stable';
          v_trend_label := 'Kondisi relatif stabil';
        END IF;
      ELSE
        v_can_show_delta := false;
        v_trend_label := 'Scan berkala untuk membaca tren';
      END IF;
    ELSE
      v_can_show_delta := false;
      v_trend_label := 'Baseline awal tersimpan';
    END IF;

    v_skin_assessment := jsonb_build_object(
      'has_face_scan', true,
      'latest_score', v_face_latest.overall_score,
      'latest_status', COALESCE(v_face_latest.skin_status_title, 'Kondisi Kulit Terpantau'),
      'skin_type', COALESCE(v_face_latest.skin_type, 'normal'),
      'analysis_notes', v_face_latest.analysis_notes,
      'latest_scanned_at', v_face_latest.created_at,
      'can_show_delta', v_can_show_delta,
      'delta_score', v_delta_score,
      'trend_direction', v_trend_direction,
      'trend_label', v_trend_label
    );
  ELSE
    v_skin_assessment := jsonb_build_object(
      'has_face_scan', false,
      'latest_score', null,
      'latest_status', 'Belum Ada Analisis',
      'skin_type', COALESCE(v_profile->>'skin_type', 'normal'),
      'analysis_notes', null,
      'latest_scanned_at', null,
      'can_show_delta', false,
      'delta_score', null,
      'trend_direction', 'none',
      'trend_label', 'Mulai Face Scan untuk diagnosa'
    );
  END IF;

  -- 5. Ringkasan produk ingredient scans
  SELECT jsonb_build_object(
    'total_products_scanned', v_ingredient_count,
    'safe_products_count', (
      SELECT count(*) FROM public.ingredient_scans
      WHERE user_id = v_user_id AND is_safe = true
    ),
    'avg_safety_score', (
      SELECT round(avg(safety_score))
      FROM public.ingredient_scans
      WHERE user_id = v_user_id AND safety_score IS NOT NULL
    )
  ) INTO v_product_summary;

  -- 6. Misi aktif
  SELECT count(*) INTO v_missions_completed
  FROM public.user_missions
  WHERE user_id = v_user_id AND is_completed = true;

  SELECT count(*) INTO v_missions_total
  FROM public.missions
  WHERE is_active = true;

  SELECT COALESCE(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
  INTO v_active_missions
  FROM (
    SELECT um.id, m.name, m.coin_reward, um.current_count, m.target_count, um.is_completed
    FROM public.user_missions um
    JOIN public.missions m ON m.id = um.mission_id
    WHERE um.user_id = v_user_id AND m.is_active = true
    ORDER BY um.is_completed ASC, m.coin_reward DESC
    LIMIT 3
  ) m;

  -- 7. Riwayat scan terakhir (Union: face + ingredient, field 'type' — bukan 'scan_type')
  SELECT COALESCE(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
  INTO v_recent_scans
  FROM (
    (
      SELECT
        'face'::text AS type,
        id,
        skin_status_title AS title,
        overall_score AS score,
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
        'ingredient'::text AS type,
        id,
        product_name AS title,
        safety_score AS score,
        created_at,
        false AS is_repeat
      FROM public.ingredient_scans
      WHERE user_id = v_user_id
      ORDER BY created_at DESC
      LIMIT 3
    )
    ORDER BY created_at DESC
    LIMIT 5
  ) r;

  -- 8. Tren wajah 7 titik untuk chart dashboard (RFC 011: is_repeat = false)
  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  INTO v_face_trend
  FROM (
    SELECT
      id,
      overall_score AS score,
      created_at
    FROM public.face_scans
    WHERE user_id = v_user_id
      AND is_repeat = false
      AND overall_score IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 7
  ) t;

  -- 9. Susun JSON final — schema CANONICAL sesuai DashboardSummaryData TypeScript interface
  v_result := jsonb_build_object(
    'profile', COALESCE(v_profile, '{}'::jsonb),
    'skin_assessment', v_skin_assessment,
    'product_summary', v_product_summary,
    'scan_counts', jsonb_build_object(
      'face_total', v_face_count,
      'ingredient_total', v_ingredient_count,
      'total', (v_face_count + v_ingredient_count)
    ),
    'missions', jsonb_build_object(
      'completed', v_missions_completed,
      'total', GREATEST(v_missions_total, 1),
      'active_list', v_active_missions
    ),
    'recent_scans', v_recent_scans,
    'face_trend', v_face_trend
  );

  RETURN v_result;
END;
$$;
