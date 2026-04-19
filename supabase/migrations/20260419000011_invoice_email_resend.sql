-- Switch invoice emails from the legacy SES-templated function to the Resend-based function.
-- The project uses Resend for transactional emails; SES path was a wrong turn.

BEGIN;

DROP FUNCTION IF EXISTS public.send_invoice_email(uuid, text, jsonb);

CREATE OR REPLACE FUNCTION public.send_invoice_email_resend(
  p_user_id uuid,
  p_variant text,
  p_invoice_number text,
  p_amount text,
  p_client_name text,
  p_due_date text,
  p_paid_at text
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
  v_body jsonb;
BEGIN
  SELECT email INTO v_owner_email
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_owner_email IS NULL OR v_owner_email = '' THEN
    RETURN;
  END IF;

  v_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/send-invoice-email';

  v_body := jsonb_build_object(
    'variant', p_variant,
    'to', v_owner_email,
    'invoice_number', p_invoice_number,
    'amount', p_amount,
    'client_name', p_client_name,
    'user_id', p_user_id
  );

  IF p_due_date IS NOT NULL THEN
    v_body := v_body || jsonb_build_object('due_date', p_due_date);
  END IF;
  IF p_paid_at IS NOT NULL THEN
    v_body := v_body || jsonb_build_object('paid_at', p_paid_at);
  END IF;

  PERFORM extensions.http_post(
    url := v_url,
    body := v_body::text,
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
  v_due := COALESCE(to_char(NEW.due_date::date, 'DD/MM/YYYY'), NULL);

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

    PERFORM public.send_invoice_email_resend(
      NEW.user_id,
      'created',
      COALESCE(NEW.invoice_number, substr(NEW.id::text, 1, 8)),
      v_formatted_amount,
      COALESCE(v_client_name, '—'),
      v_due,
      NULL
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

    PERFORM public.send_invoice_email_resend(
      NEW.user_id,
      'paid',
      COALESCE(NEW.invoice_number, substr(NEW.id::text, 1, 8)),
      v_formatted_amount,
      COALESCE(v_client_name, '—'),
      NULL,
      COALESCE(to_char(NEW.paid_at::timestamptz, 'DD/MM/YYYY'), to_char(now(), 'DD/MM/YYYY'))
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
