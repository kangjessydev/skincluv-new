-- Migration 047: Skincluv Knowledge Cache
-- Cache hasil pencarian web untuk menghindari duplikat call ke Tavily.
-- TTL: 7 hari (data faktual bisa berubah, jadi tidak permanent).
-- Bukan per-user — ini adalah pengetahuan umum Skincluv yang dibagikan antar user.

CREATE TABLE IF NOT EXISTS public.skincluv_knowledge_cache (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash  TEXT        NOT NULL UNIQUE,   -- SHA-256 hash dari normalized query
  query_text  TEXT        NOT NULL,
  sources     JSONB       NOT NULL,          -- [{title, url, snippet, score}]
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  hit_count   INT         NOT NULL DEFAULT 1
);

-- Index untuk lookup by hash (dipakai setiap search request)
CREATE INDEX IF NOT EXISTS idx_skincluv_knowledge_cache_hash
  ON public.skincluv_knowledge_cache (query_hash);

-- Index untuk cleanup expired entries
CREATE INDEX IF NOT EXISTS idx_skincluv_knowledge_cache_expires
  ON public.skincluv_knowledge_cache (expires_at);

-- RLS: public read (pengetahuan umum), write hanya via service role (Edge Function)
ALTER TABLE public.skincluv_knowledge_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_knowledge_cache"
  ON public.skincluv_knowledge_cache FOR SELECT
  USING (expires_at > NOW());  -- Hanya tampilkan yang belum expired

COMMENT ON TABLE public.skincluv_knowledge_cache IS
  'Cache hasil pencarian web (Tavily/Brave) untuk query skincare. '
  'TTL 7 hari — diperbarui jika cache miss. Bukan per-user, '
  'dibagikan lintas user untuk efisiensi biaya API.';

COMMENT ON COLUMN public.skincluv_knowledge_cache.query_hash IS
  'SHA-256 lowercase normalized query. Digunakan untuk dedup lookup.';

COMMENT ON COLUMN public.skincluv_knowledge_cache.sources IS
  'Array JSON: [{title: string, url: string, snippet: string, score: number}]';
