-- Migration Phase 18: Audit Saturation
-- Expanding auditing to core business entities and messaging templates.

SELECT public.enable_auditing('leads');
SELECT public.enable_auditing('projects');
SELECT public.enable_auditing('contracts');
SELECT public.enable_auditing('message_templates');

COMMENT ON TABLE audit_logs IS 'KONTROL Audit Trail - Saturation Level v1.0';
