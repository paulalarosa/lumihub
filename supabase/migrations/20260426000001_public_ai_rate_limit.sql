-- Rate limit DB-backed pro sales-assistant. O try_consume_ai_quota
-- existente exige p_user_id uuid (PK), mas sales-assistant é chat
-- público (sem auth) e o limite é por IP — texto, não uuid.
--
-- Tabela paralela com identifier text. Mesmo padrão de janela horária
-- + cleanup que ai_usage_counter; só muda o tipo da chave.

BEGIN;

CREATE TABLE IF NOT EXISTS public.public_ai_usage_counter (
  identifier text NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS public_ai_usage_counter_cleanup_idx
  ON public.public_ai_usage_counter (window_start);

REVOKE ALL ON public.public_ai_usage_counter FROM PUBLIC;
REVOKE ALL ON public.public_ai_usage_counter FROM anon;
REVOKE ALL ON public.public_ai_usage_counter FROM authenticated;

CREATE OR REPLACE FUNCTION public.try_consume_public_ai_quota(
  p_identifier text,
  p_endpoint text,
  p_max_per_hour integer DEFAULT 50
)
RETURNS TABLE (allowed boolean, remaining integer, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_new_count integer;
BEGIN
  v_window_start := date_trunc('hour', now());

  INSERT INTO public.public_ai_usage_counter (identifier, endpoint, window_start, count)
  VALUES (p_identifier, p_endpoint, v_window_start, 1)
  ON CONFLICT (identifier, endpoint, window_start) DO UPDATE
    SET count = public_ai_usage_counter.count + 1
  RETURNING count INTO v_new_count;

  IF v_new_count > p_max_per_hour THEN
    UPDATE public.public_ai_usage_counter
      SET count = GREATEST(count - 1, 0)
      WHERE identifier = p_identifier
        AND endpoint = p_endpoint
        AND window_start = v_window_start;

    RETURN QUERY SELECT
      false,
      0,
      v_window_start + interval '1 hour';
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true,
    p_max_per_hour - v_new_count,
    v_window_start + interval '1 hour';
END;
$$;

DO $$
DECLARE
  job_id bigint;
BEGIN
  FOR job_id IN
    SELECT jobid FROM cron.job WHERE jobname = 'khk_public_ai_usage_cleanup'
  LOOP
    PERFORM cron.unschedule(job_id);
  END LOOP;
END $$;

SELECT cron.schedule(
  'khk_public_ai_usage_cleanup',
  '0 * * * *',
  $$DELETE FROM public.public_ai_usage_counter WHERE window_start < now() - interval '6 hours';$$
);

COMMIT;
