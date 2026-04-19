-- Schedule Instagram sync jobs via pg_cron.
-- Reads Supabase URL + service role key from DB GUCs (set once via Supabase SQL Editor).
-- Fails gracefully if GUCs are missing — jobs just error silently until configured.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA cron TO postgres;

DO $$
DECLARE
  job_id bigint;
BEGIN
  FOR job_id IN
    SELECT jobid FROM cron.job
    WHERE jobname IN ('khk_sync_instagram_posts', 'khk_sync_instagram_analytics', 'khk_refresh_instagram_tokens')
  LOOP
    PERFORM cron.unschedule(job_id);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.invoke_edge_function(
  p_function_name text,
  p_body jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  v_url := current_setting('app.supabase_url', true);
  v_key := current_setting('app.service_role_key', true);

  IF v_url IS NULL OR v_url = '' OR v_key IS NULL OR v_key = '' THEN
    RAISE NOTICE 'invoke_edge_function: app.supabase_url or app.service_role_key not configured';
    RETURN;
  END IF;

  PERFORM extensions.http_post(
    url := v_url || '/functions/v1/' || p_function_name,
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

SELECT cron.schedule(
  'khk_sync_instagram_posts',
  '0 3 * * *',
  $$SELECT public.invoke_edge_function('sync-instagram-posts', '{}'::jsonb);$$
);

SELECT cron.schedule(
  'khk_sync_instagram_analytics',
  '0 4 * * *',
  $$
  SELECT public.invoke_edge_function(
    'instagram-sync-analytics',
    jsonb_build_object('connection_id', id)
  )
  FROM public.instagram_connections
  WHERE access_token IS NOT NULL;
  $$
);

SELECT cron.schedule(
  'khk_refresh_instagram_tokens',
  '0 5 * * 0',
  $$SELECT public.invoke_edge_function('refresh-instagram-tokens', '{}'::jsonb);$$
);

COMMIT;
