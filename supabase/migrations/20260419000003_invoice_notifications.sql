-- Auto-generate in-app notifications for invoice lifecycle events.
-- Fires when an invoice is created (pending) and when it is marked as paid.

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_on_invoice_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_formatted_amount text;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_formatted_amount := 'R$ ' || to_char(NEW.amount, 'FM999G999G990D00');

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
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_invoice_notify ON public.invoices;
CREATE TRIGGER on_invoice_notify
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_invoice_change();

COMMIT;
