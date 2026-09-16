-- ============================================================
-- Migration 029: RLS admin untuk ai_features, prompt_versions, model_configs
-- Menambahkan hak tulis KHUSUS admin (via is_admin()) di atas
-- RLS SELECT yang sudah ada. Tidak mengubah policy SELECT lama.
-- Juga menambahkan helper public.set_vault_secret() untuk service_role.
-- ============================================================

-- ai_features: admin boleh update (misal toggle is_active fitur)
DROP POLICY IF EXISTS "ai_features_admin_write" ON public.ai_features;
CREATE POLICY "ai_features_admin_write" ON public.ai_features
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- prompt_versions: admin boleh insert & update
DROP POLICY IF EXISTS "prompt_versions_admin_write" ON public.prompt_versions;
CREATE POLICY "prompt_versions_admin_write" ON public.prompt_versions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "prompt_versions_admin_update" ON public.prompt_versions;
CREATE POLICY "prompt_versions_admin_update" ON public.prompt_versions
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- model_configs: admin boleh insert & update (kolom api_key_secret cuma NAMA rujukan ke Vault)
DROP POLICY IF EXISTS "model_configs_admin_write" ON public.model_configs;
CREATE POLICY "model_configs_admin_write" ON public.model_configs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "model_configs_admin_update" ON public.model_configs;
CREATE POLICY "model_configs_admin_update" ON public.model_configs
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Helper function to insert or update vault secrets (Service Role Only)
-- Dipakai oleh edge function admin-set-api-key untuk menulis ke Vault.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_vault_secret(
  secret_name text,
  secret_value text,
  secret_description text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  existing_id uuid;
  result_id uuid;
BEGIN
  -- Restrict access: Only service_role can execute this function
  IF current_user != 'authenticator' AND current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: only service_role can write secrets';
  END IF;

  SELECT id INTO existing_id
  FROM vault.secrets
  WHERE name = secret_name;

  IF existing_id IS NOT NULL THEN
    PERFORM vault.update_secret(existing_id, secret_value, secret_name, secret_description);
    result_id := existing_id;
  ELSE
    SELECT vault.create_secret(secret_value, secret_name, secret_description) INTO result_id;
  END IF;

  RETURN result_id;
END;
$$;

-- Revoke all execute rights, then grant only to service_role
REVOKE EXECUTE ON FUNCTION public.set_vault_secret(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_vault_secret(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_vault_secret(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_vault_secret(text, text, text) TO service_role;
