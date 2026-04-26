-- Stripe reenvia o mesmo evento se a edge demorar, retornar erro, ou
-- a conexão cair. Sem dedup, replay duplica trabalho:
-- - update 2x em makeup_artists (status, plan_type)
-- - INSERT 2x em invoices (já tem dedup por invoice_number)
-- - dispara 2x send-subscription-welcome (2 emails de boas-vindas)
-- - cria 2 audit_logs (não-crítico mas polui)
--
-- Esta migration cria tabela de event_ids processados; o handler faz
-- INSERT antes de processar e early-return se já existe (UNIQUE conflict).

BEGIN;

CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS processed_stripe_events_processed_at_idx
  ON public.processed_stripe_events (processed_at);

REVOKE ALL ON public.processed_stripe_events FROM PUBLIC;
REVOKE ALL ON public.processed_stripe_events FROM anon;
REVOKE ALL ON public.processed_stripe_events FROM authenticated;

-- Cleanup horário: Stripe retém events 30 dias. Mantém só 35 dias de
-- buffer. Tabela não cresce infinita.
DO $$
DECLARE
  job_id bigint;
BEGIN
  FOR job_id IN
    SELECT jobid FROM cron.job WHERE jobname = 'khk_stripe_events_cleanup'
  LOOP
    PERFORM cron.unschedule(job_id);
  END LOOP;
END $$;

SELECT cron.schedule(
  'khk_stripe_events_cleanup',
  '0 3 * * *',
  $$DELETE FROM public.processed_stripe_events WHERE processed_at < now() - interval '35 days';$$
);

COMMIT;
