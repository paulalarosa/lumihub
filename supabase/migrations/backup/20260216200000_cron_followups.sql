-- Make sure pg_cron is enabled
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Concede permissão para o Supabase gerenciar o cron
GRANT USAGE ON SCHEMA cron TO postgres;

-- Executar a cada 5 minutos
SELECT cron.schedule(
  'process-followups',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/process-followups',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
