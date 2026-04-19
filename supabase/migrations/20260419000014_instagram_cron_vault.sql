-- Switch the cron edge-function invoker from DB GUCs (ALTER DATABASE) to Supabase Vault.
-- Hosted Supabase doesn't grant ALTER DATABASE to the postgres role — Vault is the correct way.

BEGIN;

CREATE OR REPLACE FUNCTION public.invoke_edge_function(
  p_function_name text,
  p_body jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  v_base_url text;
  v_key text;
BEGIN
  SELECT decrypted_secret INTO v_base_url
  FROM vault.decrypted_secrets
  WHERE name = 'khk_supabase_url';

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'khk_service_role_key';

  IF v_base_url IS NULL OR v_base_url = '' OR v_key IS NULL OR v_key = '' THEN
    RAISE NOTICE 'invoke_edge_function: vault secrets khk_supabase_url or khk_service_role_key not set';
    RETURN;
  END IF;

  PERFORM extensions.http_post(
    url := v_base_url || '/functions/v1/' || p_function_name,
    body := p_body::text,
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 30000
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'invoke_edge_function failed for %: %', p_function_name, SQLERRM;
END;
$$;

COMMIT;
