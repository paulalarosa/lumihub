-- Additional workflow triggers: contract_signed, lead_converted
-- (booking_received não existe como tabela — public-booking cria row em
--  wedding_clients, que já dispara client_created)

BEGIN;

-- contract_signed: when contract.status goes to 'signed'
CREATE OR REPLACE FUNCTION public.trg_workflow_contract_signed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'signed' AND (OLD.status IS NULL OR OLD.status != 'signed') THEN
    PERFORM public.dispatch_workflow_trigger(
      NEW.user_id,
      'contract_signed',
      jsonb_build_object(
        'contract_id', NEW.id,
        'title', NEW.title,
        'client_id', NEW.client_id,
        'project_id', NEW.project_id,
        'signed_at', NEW.signed_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workflow_on_contract_signed ON public.contracts;
CREATE TRIGGER workflow_on_contract_signed
  AFTER INSERT OR UPDATE OF status ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_workflow_contract_signed();

-- lead_converted: when lead.converted_at is set or status='won'
CREATE OR REPLACE FUNCTION public.trg_workflow_lead_converted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.converted_at IS NOT NULL AND (OLD.converted_at IS NULL OR OLD.converted_at != NEW.converted_at))
     OR (NEW.status = 'won' AND (OLD.status IS NULL OR OLD.status != 'won')) THEN
    PERFORM public.dispatch_workflow_trigger(
      NEW.user_id,
      'lead_converted',
      jsonb_build_object(
        'lead_id', NEW.id,
        'client_name', NEW.client_name,
        'email', NEW.email,
        'value', NEW.value,
        'converted_to_client_id', NEW.converted_to_client_id,
        'converted_to_project_id', NEW.converted_to_project_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workflow_on_lead_converted ON public.leads;
CREATE TRIGGER workflow_on_lead_converted
  AFTER INSERT OR UPDATE OF converted_at, status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_workflow_lead_converted();

-- =========================
-- View: workflow_execution_stats per workflow (last 30 days + all time)
-- =========================
CREATE OR REPLACE VIEW public.workflow_execution_stats AS
SELECT
  w.id AS workflow_id,
  w.user_id,
  w.name,
  w.trigger_type,
  w.is_active,
  w.run_count AS total_runs,
  count(e.*) FILTER (WHERE e.started_at >= now() - interval '30 days') AS runs_30d,
  count(e.*) FILTER (WHERE e.status = 'success') AS success_total,
  count(e.*) FILTER (WHERE e.status = 'partial_failure') AS failure_total,
  count(e.*) FILTER (
    WHERE e.status = 'success' AND e.started_at >= now() - interval '30 days'
  ) AS success_30d,
  count(e.*) FILTER (
    WHERE e.status = 'partial_failure' AND e.started_at >= now() - interval '30 days'
  ) AS failure_30d,
  max(e.started_at) AS last_run_at
FROM public.workflows w
LEFT JOIN public.workflow_executions e ON e.workflow_id = w.id
GROUP BY w.id, w.user_id, w.name, w.trigger_type, w.is_active, w.run_count;

GRANT SELECT ON public.workflow_execution_stats TO authenticated, service_role;

COMMIT;
