-- Migration 046: Chat Session Summaries for Cross-Session Memory
-- Menyimpan ringkasan AI per sesi percakapan supaya chatbot bisa membawa
-- konteks dari sesi-sesi sebelumnya tanpa menyimpan seluruh isi percakapan.
-- Dibuat background (non-blocking) setelah pesan ke-8, diperbarui tiap +5 pesan.

CREATE TABLE IF NOT EXISTS public.chat_session_summaries (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id             UUID        NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_text           TEXT        NOT NULL CHECK (char_length(summary_text) <= 700),
  message_count_at_summary INT       NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk fetch 5 summary terbaru per user dalam 30 hari (dipakai setiap request chatbot)
CREATE INDEX IF NOT EXISTS idx_chat_session_summaries_user_updated
  ON public.chat_session_summaries (user_id, updated_at DESC);

-- Satu baris per session (upsert on session_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_session_summaries_session_id
  ON public.chat_session_summaries (session_id);

-- Row Level Security: user hanya bisa akses summary miliknya sendiri
ALTER TABLE public.chat_session_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_session_summaries_select"
  ON public.chat_session_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_own_session_summaries_delete"
  ON public.chat_session_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- Service role (Edge Function) bisa write tanpa RLS
-- (menggunakan service role key yang bypass RLS)

COMMENT ON TABLE public.chat_session_summaries IS
  'Ringkasan AI per sesi percakapan untuk cross-session context injection. '
  'Sesuai prinsip minimisasi data UU PDP: tidak menyimpan percakapan lengkap, '
  'hanya ringkasan kontekstual pendek (max 700 karakter).';
