-- Remove restrictive check constraint on audit_logs.action 
-- This allows our custom logger to insert descriptive action names without violating the INSERT/UPDATE/DELETE only rule.

ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;
