-- ============================================================
-- Migration 005: AI Request Logs, Rate Limiting, Xendit Webhooks, Chat
-- Idempotent: safe to re-run
-- ============================================================

-- ---- ai_request_logs ----
CREATE TABLE IF NOT EXISTS public.ai_request_logs (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_id        uuid    NOT NULL REFERENCES public.ai_features(id),
  prompt_version_id uuid    NOT NULL REFERENCES public.prompt_versions(id),
  model_config_id   uuid    NOT NULL REFERENCES public.model_configs(id),
  input_summary     text,
  output_summary    text,
  raw_output        jsonb   NOT NULL DEFAULT '{}',
  tokens_used       integer,
  latency_ms        integer,
  cost_usd          numeric(10,6),
  status            text    NOT NULL CHECK (status IN ('success','error','rejected_no_face','rejected_no_quota')),
  user_feedback     smallint CHECK (user_feedback IN (-1, 0, 1)),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_request_logs_feature_created ON public.ai_request_logs (feature_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_request_logs_prompt_version  ON public.ai_request_logs (prompt_version_id);
CREATE INDEX IF NOT EXISTS ai_request_logs_model_config    ON public.ai_request_logs (model_config_id);
CREATE INDEX IF NOT EXISTS ai_request_logs_user_created    ON public.ai_request_logs (user_id, created_at DESC);

-- ---- rate_limit_log ----
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_slug text        NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limit_log_user_feature_time ON public.rate_limit_log (user_id, feature_slug, requested_at DESC);

-- ---- xendit_webhooks ----
CREATE TABLE IF NOT EXISTS public.xendit_webhooks (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  xendit_event_id  text    UNIQUE NOT NULL,
  event_type       text    NOT NULL,
  payload          jsonb   NOT NULL,
  processed        boolean NOT NULL DEFAULT false,
  processed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---- chat_sessions & chat_messages (stub for phase 2) ----
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_activity timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid    NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role       text    NOT NULL CHECK (role IN ('user','assistant')),
  content    text    NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON public.chat_messages (session_id, created_at ASC);

-- ---- RLS ----
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xendit_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_logs_select_own"      ON public.ai_request_logs;
DROP POLICY IF EXISTS "ai_logs_update_feedback" ON public.ai_request_logs;
DROP POLICY IF EXISTS "chat_sessions_select_own" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_messages_select_own" ON public.chat_messages;

CREATE POLICY "ai_logs_select_own" ON public.ai_request_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_logs_update_feedback" ON public.ai_request_logs
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_select_own" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chat_messages_select_own" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.chat_sessions WHERE id = session_id)
  );
