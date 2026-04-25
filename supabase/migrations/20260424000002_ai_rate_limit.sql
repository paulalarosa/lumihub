-- Rate limit DB-backed pros edge functions de IA (ai-assistant,
-- generate-contract-ai, sales-assistant). Motivação: chamadas pagam
-- tokens OpenAI/Gemini; um loop no client ou uso malicioso pode
-- acumular centenas de reais em minutos. O _shared/rate-limit.ts
-- existente é in-memory e não sobrevive a cold start — inútil pra
-- proteção de custo.
--
-- Janela: arredondada no topo da hora. Cap default 50 req/hora por
-- user/endpoint. Caller (edge function) define o cap que faz sentido.

BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_usage_counter (
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS ai_usage_counter_cleanup_idx
  ON public.ai_usage_counter (window_start);

REVOKE ALL ON public.ai_usage_counter FROM PUBLIC;
REVOKE ALL ON public.ai_usage_counter FROM anon;
REVOKE ALL ON public.ai_usage_counter FROM authenticated;

CREATE OR REPLACE FUNCTION public.try_consume_ai_quota(
  p_user_id uuid,
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

  INSERT INTO public.ai_usage_counter (user_id, endpoint, window_start, count)
  VALUES (p_user_id, p_endpoint, v_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start) DO UPDATE
    SET count = ai_usage_counter.count + 1
  RETURNING count INTO v_new_count;

  IF v_new_count > p_max_per_hour THEN
    UPDATE public.ai_usage_counter
      SET count = GREATEST(count - 1, 0)
      WHERE user_id = p_user_id
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

-- Cleanup horário: mantém só 6 janelas (6h). Tabela não cresce infinita.
DO $$
DECLARE
  job_id bigint;
BEGIN
  FOR job_id IN
    SELECT jobid FROM cron.job WHERE jobname = 'khk_ai_usage_cleanup'
  LOOP
    PERFORM cron.unschedule(job_id);
  END LOOP;
END $$;

SELECT cron.schedule(
  'khk_ai_usage_cleanup',
  '0 * * * *',
  $$DELETE FROM public.ai_usage_counter WHERE window_start < now() - interval '6 hours';$$
);

COMMIT;
