-- Expand projects_status_check to match actual app statuses.
-- Code uses 'active' / 'pending' / 'archived' / 'lead' / 'completed' / 'cancelled'
-- but the old CHECK only allowed planning/in_progress/review/completed/cancelled.

BEGIN;

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
  CHECK (status = ANY (ARRAY[
    'active'::text,
    'pending'::text,
    'planning'::text,
    'in_progress'::text,
    'review'::text,
    'confirmed'::text,
    'completed'::text,
    'archived'::text,
    'cancelled'::text,
    'lead'::text
  ]));

COMMIT;
