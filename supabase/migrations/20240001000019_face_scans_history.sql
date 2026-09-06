-- ============================================================
-- Migration 019: Face Scans History Table (Skin Journey)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.face_scans (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score           integer     NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  skin_status_title       text,
  skin_type               text        NOT NULL,
  skin_concerns           text[]      DEFAULT '{}',
  analysis_notes          text,
  area_evaluations        jsonb       DEFAULT '[]'::jsonb,
  product_recommendations jsonb       DEFAULT '[]'::jsonb,
  raw_ai_response         jsonb       DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user timeline query
CREATE INDEX IF NOT EXISTS idx_face_scans_user_created ON public.face_scans (user_id, created_at DESC);

-- RLS for face_scans
ALTER TABLE public.face_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "face_scans_select_own" ON public.face_scans;
CREATE POLICY "face_scans_select_own" ON public.face_scans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "face_scans_insert_own" ON public.face_scans;
CREATE POLICY "face_scans_insert_own" ON public.face_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "face_scans_delete_own" ON public.face_scans;
CREATE POLICY "face_scans_delete_own" ON public.face_scans
  FOR DELETE USING (auth.uid() = user_id);
