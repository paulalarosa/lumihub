-- Auto-generate invoices when a project is marked as completed.
-- Runs at the DB level so the rule is enforced regardless of how the status is changed.

BEGIN;

-- Generate sequential invoice numbers scoped per user per year: INV-YYYY-00001
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_count integer;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.invoices
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now());

  RETURN 'INV-' || v_year || '-' || LPAD(v_count::text, 5, '0');
END;
$$;

-- Creates a pending invoice when a project transitions to 'completed'.
-- Idempotent: skips if an invoice already exists for the project.
CREATE OR REPLACE FUNCTION public.create_invoice_on_project_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount numeric;
  v_existing_count integer;
BEGIN
  IF NEW.status = 'completed'
     AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN

    SELECT COUNT(*) INTO v_existing_count
    FROM public.invoices
    WHERE project_id = NEW.id
      AND (status IS NULL OR status <> 'cancelled');

    IF v_existing_count > 0 THEN
      RETURN NEW;
    END IF;

    v_amount := COALESCE(NEW.total_value, NEW.total_budget, NEW.budget, 0);

    INSERT INTO public.invoices (
      user_id, project_id, client_id, amount, status,
      invoice_number, due_date, created_at
    ) VALUES (
      NEW.user_id,
      NEW.id,
      NEW.client_id,
      v_amount,
      'pending',
      public.generate_invoice_number(NEW.user_id),
      (now() + interval '30 days')::date::text,
      now()::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_project_completed ON public.projects;
CREATE TRIGGER on_project_completed
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.create_invoice_on_project_complete();

COMMIT;
