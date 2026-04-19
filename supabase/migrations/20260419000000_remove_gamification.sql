-- Remove gamification / achievements / contextual tips from the platform.
-- Paula's decision (2026-04-19): these features will not be part of Khaos Kontrol.
-- Removes triggers, functions, and tables. Safe to run — no production feature depends on this data.

BEGIN;

-- Drop triggers that run gamification checks on every client/project insert
DROP TRIGGER IF EXISTS after_client_insert ON public.wedding_clients;
DROP TRIGGER IF EXISTS after_project_insert ON public.projects;

-- Drop trigger + unlock functions
DROP FUNCTION IF EXISTS public.trigger_check_achievements() CASCADE;
DROP FUNCTION IF EXISTS public.check_and_unlock_achievements(uuid) CASCADE;

-- Drop tables in FK-safe order
DROP TABLE IF EXISTS public.user_seen_tips CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.contextual_tips CASCADE;

COMMIT;
