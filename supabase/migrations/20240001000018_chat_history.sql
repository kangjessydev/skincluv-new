-- ============================================================
-- Migration 018: Chat Sessions and Messages Table (Chat History)
-- ============================================================

-- 1. Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT 'Konsultasi Kulit',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_sessions_select_own" ON public.chat_sessions;
CREATE POLICY "chat_sessions_select_own" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_sessions_insert_own" ON public.chat_sessions;
CREATE POLICY "chat_sessions_insert_own" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_sessions_update_own" ON public.chat_sessions;
CREATE POLICY "chat_sessions_update_own" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_sessions_delete_own" ON public.chat_sessions;
CREATE POLICY "chat_sessions_delete_own" ON public.chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Auto updated_at trigger for chat_sessions
DROP TRIGGER IF EXISTS chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender      text        NOT NULL CHECK (sender IN ('user', 'assistant')),
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Ensure user_id column exists if table was created earlier
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_own" ON public.chat_messages;
CREATE POLICY "chat_messages_select_own" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_messages_insert_own" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_own" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_messages_delete_own" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_own" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id);
