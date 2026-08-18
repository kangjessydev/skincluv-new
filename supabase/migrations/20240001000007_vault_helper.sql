-- Migration 007: Helper to read vault secrets for Edge Functions (Service Role Only)

CREATE OR REPLACE FUNCTION public.get_decrypted_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret_val text;
BEGIN
  -- Restrict access: Only the service_role can execute this function
  IF current_user != 'authenticator' AND current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: only service_role can read secrets';
  END IF;

  SELECT decrypted_secret INTO secret_val
  FROM vault.decrypted_secrets
  WHERE name = secret_name;
  
  RETURN secret_val;
END;
$$;

-- Revoke all execute rights, then grant only to service_role
REVOKE EXECUTE ON FUNCTION public.get_decrypted_secret(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_decrypted_secret(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_decrypted_secret(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_decrypted_secret(text) TO service_role;
