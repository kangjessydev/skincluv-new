-- ============================================================
-- Migration 037: Anonymous Market Intelligence & Telemetry RPC
-- Kepatuhan UU No. 27/2022 (UU PDP):
-- Mengumpulkan statistik agregat anonim (demografi jenis kulit,
-- keluhan kulit pasar, tren produk terpopuler, dan telemetri AI)
-- TANPA mengekspos identitas, nama, email, atau foto pengguna.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_market_intelligence_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_skin_types jsonb;
  v_skin_concerns jsonb;
  v_top_products jsonb;
  v_ai_telemetry jsonb;
  v_total_profiles integer;
BEGIN
  -- Hanya admin yang berhak memanggil
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat mengakses intelijen pasar';
  END IF;

  -- 1. Total profil kulit aktif
  SELECT count(*) INTO v_total_profiles FROM public.skin_profiles;

  -- 2. Demografi jenis kulit (Agregat Anonim)
  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO v_skin_types
  FROM (
    SELECT
      skin_type,
      count(*) AS count,
      CASE WHEN v_total_profiles > 0 THEN ROUND((count(*)::numeric / v_total_profiles) * 100, 1) ELSE 0 END AS percentage
    FROM public.skin_profiles
    WHERE skin_type IS NOT NULL AND skin_type <> ''
    GROUP BY skin_type
    ORDER BY count DESC
  ) sub;

  -- 3. Top Keluhan Kulit Terbanyak (Unnest array skin_concerns)
  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO v_skin_concerns
  FROM (
    SELECT
      concern,
      count(*) AS count,
      CASE WHEN v_total_profiles > 0 THEN ROUND((count(*)::numeric / v_total_profiles) * 100, 1) ELSE 0 END AS percentage
    FROM (
      SELECT unnest(skin_concerns) AS concern
      FROM public.skin_profiles
      WHERE skin_concerns IS NOT NULL
    ) raw_concerns
    WHERE concern IS NOT NULL AND concern <> ''
    GROUP BY concern
    ORDER BY count DESC
    LIMIT 10
  ) sub;

  -- 4. Top 10 Produk Kosmetik Paling Sering Di-scan
  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO v_top_products
  FROM (
    SELECT
      product_name,
      COALESCE(brand, 'Tanpa Brand') AS brand,
      category,
      scan_hit_count,
      overall_safety_score
    FROM public.skincare_product_formulas
    ORDER BY scan_hit_count DESC
    LIMIT 10
  ) sub;

  -- 5. Telemetri Kualitas & Akurasi AI
  SELECT jsonb_build_object(
    'total_requests', count(*),
    'success_count', count(*) FILTER (WHERE status = 'success'),
    'error_count', count(*) FILTER (WHERE status = 'error'),
    'rejected_no_face_count', count(*) FILTER (WHERE status = 'rejected_no_face'),
    'avg_latency_ms', ROUND(COALESCE(avg(latency_ms) FILTER (WHERE status = 'success'), 0)),
    'positive_feedback', count(*) FILTER (WHERE user_feedback = 1),
    'negative_feedback', count(*) FILTER (WHERE user_feedback = -1)
  ) INTO v_ai_telemetry
  FROM public.ai_request_logs;

  RETURN jsonb_build_object(
    'total_profiles', v_total_profiles,
    'skin_types', v_skin_types,
    'skin_concerns', v_skin_concerns,
    'top_products', v_top_products,
    'ai_telemetry', v_ai_telemetry
  );
END;
$$;
