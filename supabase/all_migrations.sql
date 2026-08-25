-- ============================================================
-- Migration 001: Profiles & Skin Profiles
-- Idempotent: safe to re-run
-- ============================================================

-- ---- profiles ----
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text UNIQUE,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- skin_profiles ----
CREATE TABLE IF NOT EXISTS public.skin_profiles (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scan_image_url    text,
  skin_type         text        NOT NULL CHECK (skin_type IN ('normal','oily','dry','combination','sensitive')),
  skin_concerns     text[]      NOT NULL DEFAULT '{}',
  analysis_notes    text        NOT NULL DEFAULT '',
  raw_ai_response   jsonb       NOT NULL DEFAULT '{}',
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Only one active skin profile per user
CREATE UNIQUE INDEX IF NOT EXISTS skin_profiles_active_unique
  ON public.skin_profiles (user_id)
  WHERE is_active = true;

-- ---- Trigger: auto-create profile on user signup ----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Drop before recreate to avoid "already exists" error on Supabase cloud
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---- Trigger: auto-update updated_at on profiles ----
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- RLS: profiles ----
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ---- RLS: skin_profiles ----
ALTER TABLE public.skin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skin_profiles_select_own" ON public.skin_profiles;
CREATE POLICY "skin_profiles_select_own" ON public.skin_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "skin_profiles_insert_own" ON public.skin_profiles;
CREATE POLICY "skin_profiles_insert_own" ON public.skin_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "skin_profiles_update_own" ON public.skin_profiles;
CREATE POLICY "skin_profiles_update_own" ON public.skin_profiles
  FOR UPDATE USING (auth.uid() = user_id);
-- ============================================================
-- Migration 002: AI Features, Prompt Versions, Model Configs
-- Idempotent: safe to re-run
-- ============================================================

-- ---- ai_features ----
CREATE TABLE IF NOT EXISTS public.ai_features (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text    UNIQUE NOT NULL,
  name        text    NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- prompt_versions ----
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id    uuid    NOT NULL REFERENCES public.ai_features(id) ON DELETE CASCADE,
  version       integer NOT NULL,
  system_prompt text    NOT NULL,
  user_prompt   text,
  notes         text,
  is_active     boolean NOT NULL DEFAULT false,
  created_by    uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feature_id, version)
);

-- ---- model_configs ----
CREATE TABLE IF NOT EXISTS public.model_configs (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id     uuid    NOT NULL REFERENCES public.ai_features(id) ON DELETE CASCADE,
  provider       text    NOT NULL CHECK (provider IN ('google', 'anthropic', 'openai')),
  model_name     text    NOT NULL,
  api_key_secret text    NOT NULL,
  parameters     jsonb   NOT NULL DEFAULT '{"temperature": 0.7, "max_tokens": 1024}',
  is_active      boolean NOT NULL DEFAULT false,
  notes          text,
  created_by     uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---- Trigger: enforce only one active prompt per feature ----
CREATE OR REPLACE FUNCTION public.enforce_single_active_prompt()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.prompt_versions
    SET is_active = false
    WHERE feature_id = NEW.feature_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prompt_versions_single_active ON public.prompt_versions;
CREATE TRIGGER prompt_versions_single_active
  BEFORE INSERT OR UPDATE ON public.prompt_versions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_active_prompt();

-- ---- Trigger: enforce only one active model config per feature ----
CREATE OR REPLACE FUNCTION public.enforce_single_active_model()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.model_configs
    SET is_active = false
    WHERE feature_id = NEW.feature_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS model_configs_single_active ON public.model_configs;
CREATE TRIGGER model_configs_single_active
  BEFORE INSERT OR UPDATE ON public.model_configs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_active_model();

-- ---- Auto-increment version per feature ----
CREATE OR REPLACE FUNCTION public.set_prompt_version_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1
    INTO NEW.version
  FROM public.prompt_versions
  WHERE feature_id = NEW.feature_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prompt_versions_auto_version ON public.prompt_versions;
CREATE TRIGGER prompt_versions_auto_version
  BEFORE INSERT ON public.prompt_versions
  FOR EACH ROW EXECUTE FUNCTION public.set_prompt_version_number();

-- ---- RLS ----
ALTER TABLE public.ai_features     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_configs   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_features_select_all"     ON public.ai_features;
DROP POLICY IF EXISTS "prompt_versions_select_all" ON public.prompt_versions;
DROP POLICY IF EXISTS "model_configs_select_all"   ON public.model_configs;

CREATE POLICY "ai_features_select_all"     ON public.ai_features     FOR SELECT TO authenticated USING (true);
CREATE POLICY "prompt_versions_select_all" ON public.prompt_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "model_configs_select_all"   ON public.model_configs   FOR SELECT TO authenticated USING (true);

-- ---- Seed: 4 core AI features ----
INSERT INTO public.ai_features (slug, name, description) VALUES
  ('face_validation', 'Face Validation', 'Validates whether the uploaded image clearly shows a human face'),
  ('face_analysis',   'Face Analysis',   'Analyzes skin type and conditions from a face image'),
  ('ingredient_scan', 'Ingredient Scan', 'Analyzes product ingredients for compatibility with user skin profile'),
  ('chatbot',         'Skin Care Chatbot','General skin care advice chatbot with user skin profile context')
ON CONFLICT (slug) DO NOTHING;
-- ============================================================
-- Migration 003: Subscriptions, Quota Configs, Quota Usage
-- Idempotent: safe to re-run
-- ============================================================

-- ---- subscription_tiers ----
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text    UNIQUE NOT NULL,
  name        text    NOT NULL,
  price_idr   integer NOT NULL DEFAULT 0,
  features    jsonb   NOT NULL DEFAULT '{}',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- subscriptions ----
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier_id         uuid    NOT NULL REFERENCES public.subscription_tiers(id),
  status          text    NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  started_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,
  quota_reset_at  timestamptz NOT NULL,
  payment_ref     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_active ON public.subscriptions (user_id) WHERE status = 'active';

-- ---- quota_configs ----
CREATE TABLE IF NOT EXISTS public.quota_configs (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id       uuid    NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE CASCADE,
  feature_id    uuid    NOT NULL REFERENCES public.ai_features(id) ON DELETE CASCADE,
  monthly_limit integer NOT NULL DEFAULT 100 CHECK (monthly_limit >= -1),
  updated_by    uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tier_id, feature_id)
);

-- ---- quota_usage ----
CREATE TABLE IF NOT EXISTS public.quota_usage (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_id      uuid    NOT NULL REFERENCES public.ai_features(id) ON DELETE CASCADE,
  subscription_id uuid    NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  used_count      integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  period_start    timestamptz NOT NULL,
  period_end      timestamptz NOT NULL,
  UNIQUE (user_id, feature_id, subscription_id)
);

-- ---- Trigger: auto-create free tier subscription on new user ----
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_free_tier_id uuid;
BEGIN
  SELECT id INTO v_free_tier_id FROM public.subscription_tiers WHERE slug = 'free' LIMIT 1;
  IF v_free_tier_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, tier_id, status, quota_reset_at)
    VALUES (
      new.id,
      v_free_tier_id,
      'active',
      now() + interval '30 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_subscription ON public.profiles;
CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- ---- RLS ----
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_configs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_usage        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tiers_select_all"         ON public.subscription_tiers;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "quota_configs_select_all" ON public.quota_configs;
DROP POLICY IF EXISTS "quota_usage_select_own"   ON public.quota_usage;

CREATE POLICY "tiers_select_all"         ON public.subscription_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "subscriptions_select_own" ON public.subscriptions      FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quota_configs_select_all" ON public.quota_configs      FOR SELECT TO authenticated USING (true);
CREATE POLICY "quota_usage_select_own"   ON public.quota_usage        FOR SELECT USING (auth.uid() = user_id);

-- ---- Seed: subscription tiers ----
INSERT INTO public.subscription_tiers (slug, name, price_idr, features) VALUES
  ('free',    'Free',    0,     '{"ai_access": false, "coin_missions": true}'),
  ('premium', 'Premium', 49000, '{"ai_access": true, "coin_missions": true, "priority_support": true}')
ON CONFLICT (slug) DO NOTHING;

-- ---- Seed: quota configs (premium tier) ----
INSERT INTO public.quota_configs (tier_id, feature_id, monthly_limit)
SELECT
  t.id,
  f.id,
  CASE f.slug
    WHEN 'face_validation' THEN 1000
    WHEN 'face_analysis'   THEN 100
    WHEN 'ingredient_scan' THEN 500
    WHEN 'chatbot'         THEN 2000
  END
FROM public.subscription_tiers t
CROSS JOIN public.ai_features f
WHERE t.slug = 'premium'
ON CONFLICT (tier_id, feature_id) DO NOTHING;

-- ---- Seed: quota configs (free tier) ----
INSERT INTO public.quota_configs (tier_id, feature_id, monthly_limit)
SELECT
  t.id,
  f.id,
  CASE f.slug
    WHEN 'face_validation' THEN 3
    WHEN 'face_analysis'   THEN 3
    WHEN 'ingredient_scan' THEN 3
    WHEN 'chatbot'         THEN 5
  END
FROM public.subscription_tiers t
CROSS JOIN public.ai_features f
WHERE t.slug = 'free'
ON CONFLICT (tier_id, feature_id) DO NOTHING;
-- ============================================================
-- Migration 004: Coins — Balances, Transactions, Missions
-- Idempotent: safe to re-run
-- ============================================================

-- ---- coin_balances ----
CREATE TABLE IF NOT EXISTS public.coin_balances (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  balance    integer     NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---- coin_transactions ----
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount       integer NOT NULL,
  type         text    NOT NULL CHECK (type IN ('mission_reward','ai_usage','admin_adjustment')),
  reference_id uuid,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coin_transactions_user_idx ON public.coin_transactions (user_id, created_at DESC);

-- ---- missions ----
CREATE TABLE IF NOT EXISTS public.missions (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text    UNIQUE NOT NULL,
  name           text    NOT NULL,
  description    text,
  type           text    NOT NULL CHECK (type IN ('daily','weekly','one_time','streak','social')),
  coin_reward    integer NOT NULL CHECK (coin_reward > 0),
  target_count   integer NOT NULL DEFAULT 1 CHECK (target_count > 0),
  cooldown_hours integer CHECK (cooldown_hours > 0),
  is_active      boolean NOT NULL DEFAULT true,
  metadata       jsonb   NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---- user_missions ----
CREATE TABLE IF NOT EXISTS public.user_missions (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id    uuid    NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  current_count integer NOT NULL DEFAULT 0 CHECK (current_count >= 0),
  is_completed  boolean NOT NULL DEFAULT false,
  completed_at  timestamptz,
  last_activity timestamptz,
  next_available timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id)
);

-- ---- Trigger: auto-create coin_balance on new user ----
CREATE OR REPLACE FUNCTION public.handle_new_user_coins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.coin_balances (user_id, balance)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_coins ON public.profiles;
CREATE TRIGGER on_profile_created_coins
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_coins();

-- ---- RLS ----
ALTER TABLE public.coin_balances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coin_balances_select_own"     ON public.coin_balances;
DROP POLICY IF EXISTS "coin_transactions_select_own" ON public.coin_transactions;
DROP POLICY IF EXISTS "missions_select_active"       ON public.missions;
DROP POLICY IF EXISTS "user_missions_select_own"     ON public.user_missions;

CREATE POLICY "coin_balances_select_own"     ON public.coin_balances     FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "coin_balances_insert_own"     ON public.coin_balances     FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coin_balances_update_own"     ON public.coin_balances     FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "coin_transactions_select_own" ON public.coin_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "coin_transactions_insert_own" ON public.coin_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "missions_select_active"       ON public.missions          FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "user_missions_select_own"     ON public.user_missions     FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_missions_insert_own"     ON public.user_missions     FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_missions_update_own"     ON public.user_missions     FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ---- Seed: initial missions ----
INSERT INTO public.missions (slug, name, description, type, coin_reward, target_count, cooldown_hours, metadata) VALUES
  ('daily_login',        'Login Harian',        'Buka app hari ini',                         'daily',    5,   1, 20,   '{"action": "login"}'),
  ('daily_face_scan',    'Scan Wajah Harian',   'Lakukan face scan hari ini',                'daily',    10,  1, 20,   '{"action": "face_scan"}'),
  ('weekly_3_scans',     '3 Scan Minggu Ini',   'Lakukan 3 face scan dalam seminggu',        'weekly',   30,  3, 144,  '{"action": "face_scan"}'),
  ('weekly_ingredient',  'Cek Ingredient 3x',   'Scan ingredient 3 kali dalam seminggu',     'weekly',   25,  3, 144,  '{"action": "ingredient_scan"}'),
  ('first_scan',         'Scan Pertama!',        'Lakukan face scan untuk pertama kali',      'one_time', 50,  1, NULL, '{"action": "face_scan"}'),
  ('complete_profile',   'Profil Lengkap',       'Isi username dan nama lengkap',             'one_time', 20,  1, NULL, '{"action": "complete_profile"}'),
  ('first_ingredient',   'Ingredient Detective', 'Scan ingredient pertama kali',              'one_time', 30,  1, NULL, '{"action": "ingredient_scan"}'),
  ('streak_7_days',      'Streak 7 Hari',        'Login 7 hari berturut-turut',               'streak',  100, 7, NULL, '{"action": "login", "streak_days": 7}'),
  ('streak_30_days',     'Streak 30 Hari',       'Login 30 hari berturut-turut',              'streak',  500, 30, NULL,'{"action": "login", "streak_days": 30}'),
  ('referral_first',     'Ajak Teman Pertama',   'Ajak 1 teman bergabung ke Skincluv',        'social',   75,  1, NULL, '{"action": "referral"}'),
  ('referral_3_friends', 'Super Referrer',       'Ajak 3 teman bergabung ke Skincluv',        'social',  200,  3, NULL, '{"action": "referral"}')
ON CONFLICT (slug) DO NOTHING;
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
-- ============================================================
-- Migration 006: Atomic Deduction Postgres Functions
-- Idempotent: all functions use CREATE OR REPLACE
-- ============================================================

-- ----------------------------------------------------------------
-- deduct_quota — atomically increment used_count if below limit
-- Returns TRUE if deduction succeeded, FALSE if quota exceeded.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_quota(
  p_user_id         uuid,
  p_feature_id      uuid,
  p_subscription_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit       integer;
  v_used        integer;
  v_tier_id     uuid;
  v_period_end  timestamptz;
BEGIN
  SELECT tier_id, quota_reset_at INTO v_tier_id, v_period_end
  FROM public.subscriptions
  WHERE id = p_subscription_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT monthly_limit INTO v_limit
  FROM public.quota_configs
  WHERE tier_id = v_tier_id AND feature_id = p_feature_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_limit = -1 THEN
    INSERT INTO public.quota_usage (user_id, feature_id, subscription_id, used_count, period_start, period_end)
    VALUES (p_user_id, p_feature_id, p_subscription_id, 1, now(), v_period_end)
    ON CONFLICT (user_id, feature_id, subscription_id)
    DO UPDATE SET used_count = quota_usage.used_count + 1;
    RETURN true;
  END IF;

  SELECT used_count INTO v_used
  FROM public.quota_usage
  WHERE user_id = p_user_id
    AND feature_id = p_feature_id
    AND subscription_id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.quota_usage (user_id, feature_id, subscription_id, used_count, period_start, period_end)
    VALUES (p_user_id, p_feature_id, p_subscription_id, 1, now(), v_period_end);
    RETURN true;
  END IF;

  IF v_used >= v_limit THEN
    RETURN false;
  END IF;

  UPDATE public.quota_usage
  SET used_count = used_count + 1
  WHERE user_id = p_user_id
    AND feature_id = p_feature_id
    AND subscription_id = p_subscription_id;

  RETURN true;
END;
$$;

-- ----------------------------------------------------------------
-- deduct_coins — atomically deduct coins if balance sufficient
-- Returns TRUE if deduction succeeded, FALSE if balance insufficient.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_coins(
  p_user_id      uuid,
  p_amount       integer,
  p_reference_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;

  SELECT balance INTO v_balance
  FROM public.coin_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_balance < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.coin_balances
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
  VALUES (p_user_id, -p_amount, 'ai_usage', p_reference_id, 'AI feature usage');

  RETURN true;
END;
$$;

-- ----------------------------------------------------------------
-- rollback_deduction — called on AI provider error (Opsi A)
-- Reverses quota increment or coin deduction.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rollback_deduction(
  p_user_id         uuid,
  p_feature_id      uuid,
  p_subscription_id uuid,
  p_mode            text,
  p_coin_amount     integer DEFAULT NULL,
  p_coin_ref        uuid    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_mode = 'quota' THEN
    UPDATE public.quota_usage
    SET used_count = GREATEST(used_count - 1, 0)
    WHERE user_id = p_user_id
      AND feature_id = p_feature_id
      AND subscription_id = p_subscription_id;

  ELSIF p_mode = 'coin' AND p_coin_amount IS NOT NULL THEN
    UPDATE public.coin_balances
    SET balance = balance + p_coin_amount, updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes)
    VALUES (p_user_id, p_coin_amount, 'admin_adjustment', p_coin_ref, 'Refund: AI provider error');
  END IF;
END;
$$;

-- ----------------------------------------------------------------
-- credit_coins — atomically credit coins for mission completion
-- ----------------------------------------------------------------
DROP FUNCTION IF EXISTS public.credit_coins(uuid, integer, uuid, text);
DROP FUNCTION IF EXISTS public.credit_coins(uuid, integer, uuid);
DROP FUNCTION IF EXISTS public.credit_coins(uuid, integer);
DROP FUNCTION IF EXISTS public.credit_coins;

CREATE OR REPLACE FUNCTION public.credit_coins(
  p_user_id    uuid,
  p_amount     integer,
  p_mission_id uuid    DEFAULT NULL,
  p_notes      text    DEFAULT 'Mission reward'
)
RETURNS public.coin_balances
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_result public.coin_balances;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;

  INSERT INTO public.coin_balances (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id) DO UPDATE
  SET balance = public.coin_balances.balance + EXCLUDED.balance,
      updated_at = now()
  RETURNING * INTO v_result;

  INSERT INTO public.coin_transactions (user_id, amount, type, reference_id, notes, created_at)
  VALUES (p_user_id, p_amount, 'mission_reward', p_mission_id, p_notes, now());

  RETURN v_result;
END;
$$;
