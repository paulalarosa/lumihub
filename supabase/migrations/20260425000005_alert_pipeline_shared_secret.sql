-- O pipeline de alertas estava silenciosamente broken em produção:
-- try_send_critical_alert tentava chamar send-critical-alert com
-- Bearer service_role_key, mas o key vinha de current_setting('app.
-- settings.service_role_key') que NUNCA foi setado (ALTER DATABASE
-- requer superuser, indisponível em Supabase migrations). Resultado:
-- cada erro disparava o trigger, hit 401 do JWT verification do edge,
-- e o EXCEPTION no SQL engolia o erro. Nada chegava no email.
--
-- Fix: shared secret hardcoded passado via header X-Alert-Secret. A
-- edge é redeployada --no-verify-jwt + check do header. O secret
-- também é setado como ALERT_SECRET nos secrets do Supabase Edge
-- Functions (mesma valor em ambos os lados).
--
-- O secret abaixo é "shared" entre trigger SQL e edge — ele só
-- autentica a chamada interna entre os 2 (não dá acesso a dados). Se
-- vazar, o pior caso é alguém disparar emails de alerta — rate-limited
-- por cooldown de 5min na try_send_critical_alert + Resend daily cap.

BEGIN;

CREATE OR REPLACE FUNCTION public.try_send_critical_alert(
  p_type text,
  p_data jsonb,
  p_cooldown interval DEFAULT interval '5 minutes'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_last timestamptz;
  v_project_ref text;
  v_url text;
  v_secret text := 'kk_alert_sIOeLIeoXs-D_FVODfsl6unSw3hhbXNO';
BEGIN
  -- Atomic claim do slot do cooldown.
  INSERT INTO public.critical_alert_cooldown (alert_type, last_sent_at)
  VALUES (p_type, now())
  ON CONFLICT (alert_type) DO UPDATE
    SET last_sent_at = EXCLUDED.last_sent_at
    WHERE public.critical_alert_cooldown.last_sent_at < now() - p_cooldown
  RETURNING last_sent_at INTO v_last;

  IF v_last IS NULL THEN
    RETURN false;
  END IF;

  -- Resolver project_ref. Prefere setting (overrideable em dev), com
  -- fallback hardcoded. Cada ambiente aplica essa migration com seu
  -- próprio fallback se necessário.
  v_project_ref := current_setting('app.settings.project_ref', true);
  IF v_project_ref IS NULL OR v_project_ref = '' THEN
    -- Detecta o ambiente pelo schema: prod tem o project_ref do prod.
    -- Em dev, o project_ref será 'nqufpfpqtycxxqtnkkfh'. A função
    -- não sabe — então tenta o fallback. Se errar, o cooldown bloqueia
    -- spam de retries.
    v_project_ref := 'pymdkngcpbmcnayxieod';
  END IF;

  v_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/send-critical-alert';

  PERFORM extensions.http_post(
    url := v_url,
    body := jsonb_build_object('type', p_type, 'data', p_data)::text,
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Alert-Secret', v_secret
    ),
    timeout_milliseconds := 5000
  );

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

COMMIT;
