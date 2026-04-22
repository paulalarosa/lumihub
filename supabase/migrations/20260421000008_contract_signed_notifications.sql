-- Rodada B1: email automático quando um contrato é assinado.
--
-- Envia 2 emails sincronizados:
--   1. Pra noiva — "Recebemos sua assinatura, tudo certo."
--   2. Pra maquiadora — "A noiva X assinou o contrato Y."
--
-- Padrão igual ao `dispatch_peer_notification` (rodada 4): trigger AFTER
-- UPDATE, helper SECURITY DEFINER, pg_net pra chamar send-email, exception
-- handler garantindo que falha no email não reverte a assinatura.

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_contract_signed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client_email text;
  v_client_name text;
  v_makeup_email text;
  v_makeup_name text;
  v_contract_title text;
  v_project_ref text;
  v_service_key text;
  v_base text;
  v_signed_date text;
BEGIN
  -- Só dispara na transição NULL → valor.
  IF OLD.signed_at IS NOT NULL OR NEW.signed_at IS NULL THEN
    RETURN NEW;
  END IF;

  v_contract_title := COALESCE(NEW.title, 'Contrato de prestação de serviços');
  v_signed_date := to_char(NEW.signed_at AT TIME ZONE 'America/Sao_Paulo',
                           'DD/MM/YYYY HH24:MI');

  -- Resolve email da noiva via client_id
  IF NEW.client_id IS NOT NULL THEN
    SELECT email, COALESCE(full_name, name, 'Noiva')
    INTO v_client_email, v_client_name
    FROM public.wedding_clients
    WHERE id = NEW.client_id;
  END IF;

  -- Resolve email da maquiadora via user_id do contract
  SELECT p.email, COALESCE(p.full_name, p.email, 'Você')
  INTO v_makeup_email, v_makeup_name
  FROM public.profiles p
  WHERE p.id = NEW.user_id;

  v_project_ref := current_setting('app.settings.project_ref', true);
  v_service_key := current_setting('app.settings.service_role_key', true);

  IF v_project_ref IS NULL OR v_project_ref = '' THEN
    v_project_ref := 'nqufpfpqtycxxqtnkkfh';
  END IF;

  v_base := 'https://' || v_project_ref || '.supabase.co/functions/v1/send-email';

  -- Email 1 → noiva (se tiver endereço)
  IF v_client_email IS NOT NULL AND v_client_email <> '' THEN
    BEGIN
      PERFORM extensions.http_post(
        url := v_base,
        body := jsonb_build_object(
          'to', v_client_email,
          'subject', 'Recebemos sua assinatura — ' || v_contract_title,
          'html', format(
            '<p>Oi, %s,</p>' ||
            '<p>Confirmamos a assinatura do contrato <strong>%s</strong> em %s.</p>' ||
            '<p>Guarde este email como comprovante. Qualquer dúvida, chama a %s pelo WhatsApp.</p>' ||
            '<p>Khaos Kontrol</p>',
            v_client_name, v_contract_title, v_signed_date, v_makeup_name
          )
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

  -- Email 2 → maquiadora (só se o email dela for diferente da noiva, evita
  -- auto-email quando a maquiadora assina contrato teste com próprio email)
  IF v_makeup_email IS NOT NULL
     AND v_makeup_email <> ''
     AND lower(v_makeup_email) <> lower(COALESCE(v_client_email, '')) THEN
    BEGIN
      PERFORM extensions.http_post(
        url := v_base,
        body := jsonb_build_object(
          'to', v_makeup_email,
          'subject', v_client_name || ' assinou o contrato',
          'html', format(
            '<p>Oi, %s,</p>' ||
            '<p><strong>%s</strong> acabou de assinar o contrato <strong>%s</strong> em %s.</p>' ||
            '<p>Os próximos passos já estão no seu painel do Khaos Kontrol.</p>' ||
            '<p><a href="https://khaoskontrol.com.br/contratos">Abrir contratos →</a></p>',
            v_makeup_name, v_client_name, v_contract_title, v_signed_date
          )
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

  -- In-app notification pra maquiadora (bell icon)
  IF NEW.user_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.notifications (
        user_id, type, title, message, action_url, related_id
      ) VALUES (
        NEW.user_id,
        'contract_signed',
        'Contrato assinado',
        v_client_name || ' assinou "' || v_contract_title || '"',
        '/contratos',
        NEW.id
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Garante que falha no notify nunca desfaz a assinatura.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_contract_signed ON public.contracts;
CREATE TRIGGER trg_notify_contract_signed
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_contract_signed();

COMMIT;
