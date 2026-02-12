-- Migration Phase 17: Service-Level Audit Expansion & UI Polish

-- 1. Helper function to enable auditing on a table
-- This provides a shortcut to apply the process_audit_log trigger.
CREATE OR REPLACE FUNCTION public.enable_auditing(table_name_input TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        DROP TRIGGER IF EXISTS tr_audit_%I ON public.%I;
        CREATE TRIGGER tr_audit_%I
        AFTER INSERT OR UPDATE OR DELETE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
    ', table_name_input, table_name_input, table_name_input, table_name_input);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Expand auditing to meta tables
SELECT public.enable_auditing('system_config');
SELECT public.enable_auditing('services');
SELECT public.enable_auditing('project_services');
SELECT public.enable_auditing('team_members');
SELECT public.enable_auditing('team_invites');

COMMENT ON TABLE audit_logs IS 'KONTROL Audit Trail - Expanded Coverage v1.0';
