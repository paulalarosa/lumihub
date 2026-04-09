-- Migration: Fix audit_logs constraint to allow admin actions
-- Created: 2026-04-09
-- Reason: Error 23514 (check constraint violation) when admins perform custom actions like ADMIN_ADD_STUDIO_TAG.

-- 1. Remove the restrictive constraint
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_action_check;

-- 2. Add a new, expanded constraint or just leave it flexible
-- Option A: Expanded list of known actions
-- Option B: Remove completely for flexibility (Selected here)
-- We remove it because the system is evolving and adding new action types via RPCs and Edge Functions.
-- The 'action' column is already NOT NULL text.

-- If you prefer a list, uncomment this:
-- ALTER TABLE public.audit_logs 
-- ADD CONSTRAINT audit_logs_action_check 
-- CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'ADMIN_ADD_STUDIO_TAG', 'ADMIN_REMOVE_STUDIO_TAG', 'ADMIN_UPGRADE_PLAN', 'GHOST_LOGIN'));
