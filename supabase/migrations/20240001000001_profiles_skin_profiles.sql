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
