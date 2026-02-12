-- Migration for Feedback and Tracking SES Triggers

-- 1. Feedback Trigger (on Invoice Paid)
CREATE OR REPLACE FUNCTION public.handle_invoice_paid_feedback()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    PERFORM net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-ses-email',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body := jsonb_build_object(
          'to', jsonb_build_array((SELECT email FROM public.wedding_clients WHERE id = NEW.client_id)),
          'template', 'Khaos_Feedback',
          'templateData', jsonb_build_object(
              'name', (SELECT name FROM public.wedding_clients WHERE id = NEW.client_id),
              'order_id', NEW.id,
              'amount', NEW.amount
          ),
          'userId', NEW.user_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_invoice_paid_feedback ON public.invoices;
CREATE TRIGGER on_invoice_paid_feedback
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invoice_paid_feedback();

-- 2. Tracking Trigger (on Project Status Change to In Progress)
CREATE OR REPLACE FUNCTION public.handle_project_tracking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    PERFORM net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-ses-email',
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body := jsonb_build_object(
          'to', jsonb_build_array((SELECT email FROM public.wedding_clients WHERE id = NEW.client_id)),
          'template', 'Khaos_Tracking',
          'templateData', jsonb_build_object(
              'name', (SELECT name FROM public.wedding_clients WHERE id = NEW.client_id),
              'project_name', NEW.name,
              'status', 'Em Andamento'
          ),
          'userId', NEW.user_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_status_tracking ON public.projects;
CREATE TRIGGER on_project_status_tracking
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_project_tracking();
