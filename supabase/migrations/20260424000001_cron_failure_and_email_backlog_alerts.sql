-- Adiciona 2 alertas de observabilidade que cobrem gaps do
-- critical_alerts_triggers original:
--
-- 1. cron_failure: se qualquer pg_cron job falhar nos últimos 15min,
--    dispara alerta com summary (job names + count). Cobre silent
--    failures de process-email-queue, daily-digest, instagram syncs,
--    invoice trigger, etc.
--
-- 2. email_queue_backlog: se > 50 emails ficam 'pending' há mais de
--    30min, é sinal que o cron process-email-queue está travado mesmo
--    sem falhar (ex: API key Resend inválida fazendo 401 silencioso).
--
-- Ambos reutilizam try_send_critical_alert — mesmo debounce de 5min,
-- mesma edge function send-critical-alert.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ────────────────────────────────────────────────────────────────
-- Check 1: cron job failures
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_cron_failures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, cron
AS $$
DECLARE
  v_count integer;
  v_failed_jobs jsonb;
BEGIN
  SELECT
    count(*),
    jsonb_agg(
      jsonb_build_object(
        'jobname', j.jobname,
        'runid', d.runid,
        'return_message', left(COALESCE(d.return_message, ''), 300),
        'start_time', d.start_time
      )
      ORDER BY d.start_time DESC
    )
  INTO v_count, v_failed_jobs
  FROM cron.job_run_details d
  JOIN cron.job j ON j.jobid = d.jobid
  WHERE d.status = 'failed'
    AND d.start_time > now() - interval '15 minutes'
    -- Ignora o próprio monitor pra evitar loop infinito.
    AND j.jobname <> 'khk_cron_failure_monitor';

  IF v_count > 0 THEN
    PERFORM public.try_send_critical_alert(
      'cron_failure',
      jsonb_build_object(
        'count', v_count,
        'window_minutes', 15,
        'failed_jobs', v_failed_jobs
      )
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- Check 2: email queue backlog
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_email_queue_backlog()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_pending_count integer;
  v_oldest timestamptz;
BEGIN
  SELECT count(*), min(scheduled_for)
  INTO v_pending_count, v_oldest
  FROM public.email_queue
  WHERE status = 'pending'
    AND scheduled_for < now() - interval '30 minutes';

  IF v_pending_count > 50 THEN
    PERFORM public.try_send_critical_alert(
      'email_queue_backlog',
      jsonb_build_object(
        'pending_count', v_pending_count,
        'oldest_scheduled_for', v_oldest,
        'threshold_minutes', 30
      )
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- Cron: roda os 2 checks a cada 15 minutos.
-- ────────────────────────────────────────────────────────────────
DO $$
DECLARE
  job_id bigint;
BEGIN
  FOR job_id IN
    SELECT jobid FROM cron.job
    WHERE jobname IN ('khk_cron_failure_monitor', 'khk_email_backlog_monitor')
  LOOP
    PERFORM cron.unschedule(job_id);
  END LOOP;
END $$;

SELECT cron.schedule(
  'khk_cron_failure_monitor',
  '*/15 * * * *',
  $$SELECT public.check_cron_failures();$$
);

SELECT cron.schedule(
  'khk_email_backlog_monitor',
  '*/15 * * * *',
  $$SELECT public.check_email_queue_backlog();$$
);

COMMIT;
