-- Migration 048: Search Providers Configuration
-- Tabel konfigurasi search provider yang pluggable — bisa ganti provider
-- via admin tanpa redeploy Edge Function.

CREATE TABLE IF NOT EXISTS public.search_providers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL UNIQUE,   -- 'tavily', 'brave', dll
  display_name   TEXT        NOT NULL,
  api_key_secret TEXT        NOT NULL,          -- nama secret di Supabase Vault
  base_url       TEXT        NOT NULL,
  is_active      BOOLEAN     NOT NULL DEFAULT FALSE,
  priority       INT         NOT NULL DEFAULT 1, -- lower = higher priority
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: Tavily sebagai default provider (inactive sampai API key di-setup)
INSERT INTO public.search_providers (name, display_name, api_key_secret, base_url, is_active, priority)
VALUES
  ('tavily',  'Tavily AI Search',  'tavily_api_key',  'https://api.tavily.com',        false, 1),
  ('brave',   'Brave Search',      'brave_api_key',   'https://api.search.brave.com',  false, 2)
ON CONFLICT (name) DO NOTHING;

-- RLS: admin-only write, tidak perlu read dari client (diakses Edge Function via service role)
ALTER TABLE public.search_providers ENABLE ROW LEVEL SECURITY;

-- Tidak ada policy untuk anon/authenticated — hanya service role yang bisa akses

COMMENT ON TABLE public.search_providers IS
  'Konfigurasi search provider yang dapat diganti tanpa redeploy. '
  'is_active = true artinya provider ini dipakai oleh invoke-ai. '
  'Hanya satu provider yang boleh aktif pada satu waktu (priority=1 dipilih pertama).';

COMMENT ON COLUMN public.search_providers.api_key_secret IS
  'Nama secret di Supabase Vault. Edge Function akan decrypt via get_decrypted_secret().';
