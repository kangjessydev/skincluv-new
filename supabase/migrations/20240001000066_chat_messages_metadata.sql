-- ============================================================
-- Migration 066: Chat Messages Metadata for In-Chat UI Attachments (RFC 012)
-- 1. Add metadata jsonb column to public.chat_messages
-- 2. Create GIN index on metadata
-- ============================================================

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata
  ON public.chat_messages USING gin (metadata);
