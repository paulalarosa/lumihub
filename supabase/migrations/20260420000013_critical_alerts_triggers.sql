-- Critical alerts: auto-email khaoskontrol07 whenever a payment fails,
-- a system_log is written at level=error, or a workflow execution fails.
-- Calls the send-critical-alert Edge Function via pg_net.
-- Cooldown table prevents email-flooding when the same alert type fires many
-- times in a short window (default 5 min per type).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Cooldown to debounce bursty alerts.
CREATE TABLE IF NOT EXISTS public.critical_alert_cooldown (
  alert_type text PRIMARY KEY,
  last_sent_at timestamptz NOT NULL DEFAULT now()
);

-- Only service_role writes/reads. No RLS needed (restrict via grants).
REVOKE ALL ON public.critical_alert_cooldown FROM PUBLIC;
REVOKE ALL ON public.critical_alert_cooldown FROM anon;
REVOKE ALL ON public.critical_alert_cooldown FROM authenticated;

-- Core helper. Returns true if alert was sent, false if debounced.
-- Always returns (never throws) — critical alerts must not block the main txn.
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
  v_service_key text;
  v_url text;
BEGIN
  -- Atomic check-and-update: only returns a row if we actually claimed the slot.
  INSERT INTO public.critical_alert_cooldown (alert_type, last_sent_at)
  VALUES (p_type, now())
  ON CONFLICT (alert_type) DO UPDATE
    SET last_sent_at = EXCLUDED.last_sent_at
    WHERE public.critical_alert_cooldown.last_sent_at < now() - p_cooldown
  RETURNING last_sent_at INTO v_last;

  IF v_last IS NULL THEN
    RETURN false;
  END IF;

  v_project_ref := current_setting('app.settings.project_ref', true);
  v_service_key := current_setting('app.settings.service_role_key', true);

  IF v_project_ref IS NULL OR v_project_ref = '' THEN
    v_project_ref := 'nqufpfpqtycxxqtnkkfh';
  END IF;

  v_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/send-critical-alert';

  PERFORM extensions.http_post(
    url := v_url,
    body := jsonb_build_object('type', p_type, 'data', p_data)::text,
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_service_key, '')
    ),
    timeout_milliseconds := 5000
  );

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Invoice payment failed (INSERT with failed status OR UPDATE transitioning to failed/overdue)
CREATE OR REPLACE FUNCTION public.notify_payment_failed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('failed', 'overdue')
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.try_send_critical_alert(
      'payment_failed',
      jsonb_build_object(
        'invoice_id', NEW.id,
        'amount', NEW.amount,
        'status', NEW.status,
        'invoice_number', NEW.invoice_number,
        'user_id', NEW.user_id,
        'created_at', NEW.created_at
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_invoice_payment_failed ON public.invoices;
CREATE TRIGGER on_invoice_payment_failed
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_failed();

-- System log at level=error
CREATE OR REPLACE FUNCTION public.notify_system_error()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.level = 'error' THEN
    PERFORM public.try_send_critical_alert(
      'system_error',
      jsonb_build_object(
        'log_id', NEW.id,
        'level', NEW.level,
        'message', COALESCE(NEW.message, ''),
        'user_id', NEW.user_id,
        'created_at', NEW.created_at
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_system_log_error ON public.system_logs;
CREATE TRIGGER on_system_log_error
  AFTER INSERT ON public.system_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_system_error();

-- Workflow execution failed
CREATE OR REPLACE FUNCTION public.notify_workflow_failed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'failed'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.try_send_critical_alert(
      'workflow_failed',
      jsonb_build_object(
        'execution_id', NEW.id,
        'workflow_id', NEW.workflow_id,
        'status', NEW.status,
        'error', COALESCE(NEW.error, ''),
        'started_at', NEW.started_at,
        'completed_at', NEW.completed_at
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_workflow_failed ON public.workflow_executions;
CREATE TRIGGER on_workflow_failed
  AFTER INSERT OR UPDATE ON public.workflow_executions
  FOR EACH ROW EXECUTE FUNCTION public.notify_workflow_failed();

COMMIT;
