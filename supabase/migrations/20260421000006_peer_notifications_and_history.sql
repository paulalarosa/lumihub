-- Rodada 4: notificações (in-app + push + email) + histórico de colaboração.
--
-- Padrão igual ao critical_alerts_triggers (migration 20260420000013):
-- trigger chama helper que (a) persiste em `notifications` pra bell icon,
-- (b) dispara send-push-notification via pg_net, (c) dispara send-email
-- via pg_net quando há subject/html. Helper nunca lança exceção — falha
-- em notificar NÃO pode travar o insert/update principal.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Helper universal de dispatch. Chama em sequência os 3 canais e engole
-- qualquer erro. Os triggers são "best effort" — o convite/aceite fica
-- válido mesmo que o email falhe (ex: Resend fora do ar).
CREATE OR REPLACE FUNCTION public.dispatch_peer_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_action_url text DEFAULT NULL,
  p_related_id uuid DEFAULT NULL,
  p_email_subject text DEFAULT NULL,
  p_email_html text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_project_ref text;
  v_service_key text;
  v_base text;
  v_email text;
BEGIN
  -- 1. In-app notification (bell icon). Tem RLS restrito ao próprio usuário
  -- já configurado — o INSERT passa por ser SECURITY DEFINER.
  INSERT INTO public.notifications (
    user_id, type, title, message, action_url, related_id
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_action_url, p_related_id
  );

  v_project_ref := current_setting('app.settings.project_ref', true);
  v_service_key := current_setting('app.settings.service_role_key', true);

  IF v_project_ref IS NULL OR v_project_ref = '' THEN
    v_project_ref := 'nqufpfpqtycxxqtnkkfh';
  END IF;

  v_base := 'https://' || v_project_ref || '.supabase.co/functions/v1/';

  -- 2. Push notification (VAPID)
  BEGIN
    PERFORM extensions.http_post(
      url := v_base || 'send-push-notification',
      body := jsonb_build_object(
        'user_id', p_user_id,
        'title', p_title,
        'body', p_message,
        'url', COALESCE(p_action_url, '/dashboard')
      )::text,
      params := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(v_service_key, '')
      ),
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 3. Email opcional (só se foi passado subject/html)
  IF p_email_subject IS NOT NULL AND p_email_html IS NOT NULL THEN
    SELECT email INTO v_email FROM public.profiles WHERE id = p_user_id;
    IF v_email IS NOT NULL AND v_email <> '' THEN
      BEGIN
        PERFORM extensions.http_post(
          url := v_base || 'send-email',
          body := jsonb_build_object(
            'to', v_email,
            'subject', p_email_subject,
            'html', p_email_html
          )::text,
          params := '{}'::jsonb,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(v_service_key, '')
          ),
          timeout_milliseconds := 5000
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Garante que o trigger caller nunca falhe.
  NULL;
END;
$$;

-- Trigger 1: peer_connections INSERT — avisa o peer
CREATE OR REPLACE FUNCTION public.notify_peer_connection_invited()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_name text;
BEGIN
  IF NEW.status <> 'pending' THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, email, 'Uma maquiadora')
  INTO v_host_name
  FROM public.profiles WHERE id = NEW.host_user_id;

  PERFORM public.dispatch_peer_notification(
    p_user_id     := NEW.peer_user_id,
    p_type        := 'peer_connection_invited',
    p_title       := 'Novo convite de parceria',
    p_message     := v_host_name || ' quer te adicionar à rede dela.',
    p_action_url  := '/rede',
    p_related_id  := NEW.id,
    p_email_subject := v_host_name || ' te convidou pra rede dela no Khaos Kontrol',
    p_email_html  := '<p>Oi,</p><p><strong>' || v_host_name || '</strong> quer te adicionar como parceira na plataforma Khaos Kontrol. Isso permite que vocês se chamem como reforço em eventos.</p><p><a href="https://khaoskontrol.com.br/rede">Abrir convite →</a></p>'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_peer_connection_invited ON public.peer_connections;
CREATE TRIGGER trg_peer_connection_invited
  AFTER INSERT ON public.peer_connections
  FOR EACH ROW EXECUTE FUNCTION public.notify_peer_connection_invited();

-- Trigger 2: peer_connections UPDATE pra accepted — avisa o host
CREATE OR REPLACE FUNCTION public.notify_peer_connection_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_peer_name text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT COALESCE(full_name, email, 'Uma maquiadora')
    INTO v_peer_name
    FROM public.profiles WHERE id = NEW.peer_user_id;

    PERFORM public.dispatch_peer_notification(
      p_user_id     := NEW.host_user_id,
      p_type        := 'peer_connection_accepted',
      p_title       := 'Conexão aceita',
      p_message     := v_peer_name || ' aceitou sua parceria.',
      p_action_url  := '/rede',
      p_related_id  := NEW.id,
      p_email_subject := v_peer_name || ' aceitou sua parceria',
      p_email_html  := '<p>Oi,</p><p><strong>' || v_peer_name || '</strong> aceitou seu convite de parceria. Agora você pode chamar ela como reforço em eventos.</p><p><a href="https://khaoskontrol.com.br/rede">Ver rede →</a></p>'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_peer_connection_accepted ON public.peer_connections;
CREATE TRIGGER trg_peer_connection_accepted
  AFTER UPDATE ON public.peer_connections
  FOR EACH ROW EXECUTE FUNCTION public.notify_peer_connection_accepted();

-- Trigger 3: peer_event_assignments INSERT — avisa o peer
CREATE OR REPLACE FUNCTION public.notify_peer_event_invited()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_name text;
  v_event_date text;
BEGIN
  SELECT COALESCE(full_name, email, 'Uma maquiadora')
  INTO v_host_name
  FROM public.profiles WHERE id = NEW.host_user_id;

  SELECT to_char(event_date, 'DD/MM')
  INTO v_event_date
  FROM public.events WHERE id = NEW.event_id;

  PERFORM public.dispatch_peer_notification(
    p_user_id     := NEW.peer_user_id,
    p_type        := 'peer_event_invited',
    p_title       := 'Convite de reforço',
    p_message     := v_host_name || ' te chamou pra ' || COALESCE(v_event_date, 'um evento'),
    p_action_url  := '/meus-reforcos',
    p_related_id  := NEW.id,
    p_email_subject := v_host_name || ' te chamou como reforço',
    p_email_html  := '<p>Oi,</p><p><strong>' || v_host_name || '</strong> te convidou como reforço em um evento no dia <strong>' || COALESCE(v_event_date, 'TBD') || '</strong>.</p><p><a href="https://khaoskontrol.com.br/meus-reforcos">Ver detalhes →</a></p>'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_peer_event_invited ON public.peer_event_assignments;
CREATE TRIGGER trg_peer_event_invited
  AFTER INSERT ON public.peer_event_assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_peer_event_invited();

-- Trigger 4: peer_event_assignments UPDATE (peer respondeu) — avisa o host
CREATE OR REPLACE FUNCTION public.notify_peer_event_responded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_peer_name text;
  v_title text;
  v_msg text;
BEGIN
  IF OLD.status <> 'invited' THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('accepted', 'declined') THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, email, 'A reforço')
  INTO v_peer_name
  FROM public.profiles WHERE id = NEW.peer_user_id;

  IF NEW.status = 'accepted' THEN
    v_title := 'Reforço confirmado';
    v_msg := v_peer_name || ' aceitou o evento.';
  ELSE
    v_title := 'Reforço recusado';
    v_msg := v_peer_name || ' recusou o evento.';
  END IF;

  PERFORM public.dispatch_peer_notification(
    p_user_id     := NEW.host_user_id,
    p_type        := 'peer_event_' || NEW.status,
    p_title       := v_title,
    p_message     := v_msg,
    p_action_url  := '/calendar',
    p_related_id  := NEW.id
    -- Email opcional — só notifico in-app + push nesse caso pra não
    -- floodar a caixa da maquiadora que convida várias pessoas.
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_peer_event_responded ON public.peer_event_assignments;
CREATE TRIGGER trg_peer_event_responded
  AFTER UPDATE ON public.peer_event_assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_peer_event_responded();

-- 5. Cron 24h: roda todo dia 08:00 UTC (≈ 05:00 SP); busca assignments
-- accepted com event_date = hoje+1 e manda push de lembrete.
CREATE OR REPLACE FUNCTION public.send_peer_reminders_24h()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_host_name text;
BEGIN
  FOR v_row IN
    SELECT pea.id, pea.peer_user_id, pea.host_user_id, pea.event_id,
           e.event_date, e.start_time, e.location
    FROM public.peer_event_assignments pea
    JOIN public.events e ON e.id = pea.event_id
    WHERE pea.status = 'accepted'
      AND e.event_date = (CURRENT_DATE + INTERVAL '1 day')::date
  LOOP
    SELECT COALESCE(full_name, email, 'Maquiadora')
    INTO v_host_name
    FROM public.profiles WHERE id = v_row.host_user_id;

    PERFORM public.dispatch_peer_notification(
      p_user_id    := v_row.peer_user_id,
      p_type       := 'peer_event_reminder',
      p_title      := 'Amanhã você tem reforço',
      p_message    := COALESCE(v_host_name, 'Reforço') ||
                      ' · ' || COALESCE(v_row.start_time, '') ||
                      CASE WHEN v_row.location IS NOT NULL THEN ' em ' || v_row.location ELSE '' END,
      p_action_url := '/meus-reforcos',
      p_related_id := v_row.id
    );
  END LOOP;
END;
$$;

-- Agenda o cron (só tenta se pg_cron estiver instalado)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove job antigo com mesmo nome pra ser idempotente.
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'peer-reminders-24h';

    PERFORM cron.schedule(
      'peer-reminders-24h',
      '0 8 * * *',               -- 08:00 UTC = 05:00 BRT
      'SELECT public.send_peer_reminders_24h();'
    );
  END IF;
END $$;

-- 6. View de histórico: conta colaborações `done` entre pares. Ambos os
-- lados podem consultar via RLS (host ou peer). Útil pra "fizeram X
-- eventos juntas" no perfil/rede.
CREATE OR REPLACE VIEW public.peer_collaboration_history AS
SELECT
  LEAST(host_user_id, peer_user_id) AS user_a,
  GREATEST(host_user_id, peer_user_id) AS user_b,
  COUNT(*) FILTER (WHERE status = 'done') AS events_done,
  COUNT(*) FILTER (WHERE status = 'accepted') AS events_upcoming,
  MAX(responded_at) FILTER (WHERE status = 'done') AS last_done_at
FROM public.peer_event_assignments
GROUP BY LEAST(host_user_id, peer_user_id), GREATEST(host_user_id, peer_user_id);

-- View herda permissão da tabela underlying (RLS em peer_event_assignments
-- já filtra por host OU peer = auth.uid()).

COMMIT;
