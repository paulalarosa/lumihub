
-- Remove the restrictive check constraint on audit_logs.action
-- This allows more flexible action names from the frontend (e.g., USER_SIGN_IN, CONTRACT_GENERATION)
alter table public.audit_logs drop constraint if exists audit_logs_action_check;

-- Optionally, we could add a broader one or just leave it open if it's purely for traceability.
-- Given the error 23514, this is the most direct fix.
