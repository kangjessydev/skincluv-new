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

CREATE POLICY "coin_balances_select_own"     ON public.coin_balances     FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coin_transactions_select_own" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "missions_select_active"       ON public.missions          FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "user_missions_select_own"     ON public.user_missions     FOR SELECT USING (auth.uid() = user_id);

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
