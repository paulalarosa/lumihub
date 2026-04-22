-- Rodada C1: rate limit no login da noiva.
--
-- PIN de 4 dígitos = 10k combinações. Sem rate limit, atacante varre todas
-- em minutos (aprox 100req/s é suficiente). Com o limite abaixo, após 5
-- tentativas falhas em 15min a cliente fica bloqueada por 15min.
--
-- Tabela nova `bride_pin_attempts` registra tentativas por client_id.
-- bride_login checa antes de validar PIN; se lockado, rejeita sem revelar
-- se o PIN estaria correto (mesma mensagem).

BEGIN;

CREATE TABLE IF NOT EXISTS public.bride_pin_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.wedding_clients(id) ON DELETE CASCADE,
  succeeded boolean NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Index pro lookup rate-limit (últimas N tentativas por cliente).
CREATE INDEX IF NOT EXISTS idx_bride_pin_attempts_client_time
  ON public.bride_pin_attempts (client_id, attempted_at DESC);

-- Só service_role escreve/lê; anon nunca vê.
ALTER TABLE public.bride_pin_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bride_pin_attempts FROM PUBLIC;
REVOKE ALL ON public.bride_pin_attempts FROM anon;
REVOKE ALL ON public.bride_pin_attempts FROM authenticated;

CREATE POLICY ppa_admin_read ON public.bride_pin_attempts
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Janela do lock (parametrizável se precisar ajustar depois)
CREATE OR REPLACE FUNCTION public.bride_login(
  p_client_id uuid,
  p_pin_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client RECORD;
  v_token text;
  v_hash text;
  v_failed_recent integer;
  v_window interval := interval '15 minutes';
  v_max_fails integer := 5;
BEGIN
  IF p_client_id IS NULL OR p_pin_code IS NULL OR trim(p_pin_code) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dados inválidos');
  END IF;

  -- Rate limit: conta tentativas falhas nas últimas 15min. Se >= 5, lock.
  -- Resposta genérica "PIN inválido" pra não vazar "você está lockado".
  SELECT COUNT(*) INTO v_failed_recent
  FROM public.bride_pin_attempts
  WHERE client_id = p_client_id
    AND succeeded = false
    AND attempted_at > now() - v_window;

  IF v_failed_recent >= v_max_fails THEN
    INSERT INTO public.bride_pin_attempts (client_id, succeeded)
    VALUES (p_client_id, false);
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.'
    );
  END IF;

  SELECT id, name, full_name, email
  INTO v_client
  FROM public.wedding_clients
  WHERE id = p_client_id
    AND access_pin = trim(p_pin_code);

  IF NOT FOUND THEN
    INSERT INTO public.bride_pin_attempts (client_id, succeeded)
    VALUES (p_client_id, false);
    RETURN jsonb_build_object('success', false, 'error', 'PIN inválido');
  END IF;

  -- Registra sucesso (limpa contador de falhas na prática — queries só
  -- olham falhas na janela, sucessos não bloqueiam)
  INSERT INTO public.bride_pin_attempts (client_id, succeeded)
  VALUES (p_client_id, true);

  -- Invalida tokens anteriores (um device ativo por vez)
  UPDATE public.bride_access_tokens
  SET is_revoked = true
  WHERE client_id = v_client.id AND is_revoked = false;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  INSERT INTO public.bride_access_tokens (
    client_id, token_hash, plain_token, expires_at
  ) VALUES (
    v_client.id, v_hash, v_token, now() + interval '30 days'
  );

  RETURN jsonb_build_object(
    'success', true,
    'token', v_token,
    'client_id', v_client.id,
    'client_name', COALESCE(v_client.full_name, v_client.name),
    'client_email', v_client.email
  );
END;
$$;

-- Cron: limpa tentativas > 7 dias diariamente pra tabela não inflar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'bride-pin-attempts-cleanup';

    PERFORM cron.schedule(
      'bride-pin-attempts-cleanup',
      '0 3 * * *',
      $cleanup$
        DELETE FROM public.bride_pin_attempts
        WHERE attempted_at < now() - interval '7 days';
      $cleanup$
    );
  END IF;
END $$;

COMMIT;
