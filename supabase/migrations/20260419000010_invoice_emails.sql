-- Extend invoice lifecycle trigger to also send transactional emails via SES.
-- Sends khk_invoice_created on insert, khk_invoice_paid on status transition to 'paid'.
-- Silently no-ops if SES keys or templates are missing in the edge function.

BEGIN;

CREATE OR REPLACE FUNCTION public.send_invoice_email(
  p_user_id uuid,
  p_template text,
  p_template_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_project_ref text := 'nqufpfpqtycxxqtnkkfh';
  v_owner_email text;
  v_url text;
BEGIN
  SELECT email INTO v_owner_email
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_owner_email IS NULL OR v_owner_email = '' THEN
    RETURN;
  END IF;

  v_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/send-ses-email';

  PERFORM extensions.http_post(
    url := v_url,
    body := jsonb_build_object(
      'to', jsonb_build_array(v_owner_email),
      'template', p_template,
      'templateData', p_template_data,
      'userId', p_user_id
    )::text,
    params := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 5000
  );

EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_invoice_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_formatted_amount text;
  v_client_name text;
  v_due text;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_formatted_amount := 'R$ ' || to_char(NEW.amount, 'FM999G999G990D00');
  v_due := COALESCE(to_char(NEW.due_date::date, 'DD/MM/YYYY'), 'A definir');

  SELECT full_name INTO v_client_name FROM public.wedding_clients WHERE id = NEW.client_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id, action_url)
    VALUES (
      NEW.user_id,
      'invoice_created',
      'Nova fatura gerada',
      'Fatura ' || COALESCE(NEW.invoice_number, substr(NEW.id::text, 1, 8)) ||
      ' no valor de ' || v_formatted_amount || ' foi criada.',
      NEW.id,
      '/billing'
    );

    PERFORM public.send_invoice_email(
      NEW.user_id,
      'khk_invoice_created',
      jsonb_build_object(
        'invoice_number', COALESCE(NEW.invoice_number, substr(NEW.id::text, 1, 8)),
        'amount', v_formatted_amount,
        'client_name', COALESCE(v_client_name, '—'),
        'due_date', v_due
      )
    );

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.status = 'paid'
     AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id, action_url)
    VALUES (
      NEW.user_id,
      'invoice_paid',
      'Pagamento recebido',
      'Fatura ' || COALESCE(NEW.invoice_number, substr(NEW.id::text, 1, 8)) ||
      ' (' || v_formatted_amount || ') foi paga.',
      NEW.id,
      '/billing'
    );

    PERFORM public.send_invoice_email(
      NEW.user_id,
      'khk_invoice_paid',
      jsonb_build_object(
        'invoice_number', COALESCE(NEW.invoice_number, substr(NEW.id::text, 1, 8)),
        'amount', v_formatted_amount,
        'client_name', COALESCE(v_client_name, '—'),
        'paid_at', COALESCE(to_char(NEW.paid_at::timestamptz, 'DD/MM/YYYY'), to_char(now(), 'DD/MM/YYYY'))
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
