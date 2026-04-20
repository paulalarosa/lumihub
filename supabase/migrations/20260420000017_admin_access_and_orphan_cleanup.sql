-- Admin visibility on assistant_access + cleanup of known orphan events/projects.
--
-- Context:
-- - Maquiadora Nathalia couldn't see her invited assistant Yamar because the
--   frontend hook queried `assistants` directly relying on RLS. The hook was
--   refactored to explicitly join via `assistant_access`, which needs admin
--   SELECT bypass so the admin panel still sees every linking row.
-- - Two orphan rows tracked down via direct SQL sweep (2026-04-20):
--     event:   bb19931d-b7c8-4095-8c4b-f2fb99f7307b  "casamento yasmin"
--     project: d899df0b-b987-4308-8846-85afd4a77587  "casamento ana"
--   Both had no client_id and predate the inline-client-creation UI.

BEGIN;

-- Admin bypass on assistant_access (mirrors other admin policies from
-- migration 20260420000015).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    RAISE EXCEPTION 'public.is_admin() helper missing — cannot add admin policies';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'assistant_access' AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "admins_select_all_assistant_access" ON public.assistant_access';
    EXECUTE 'CREATE POLICY "admins_select_all_assistant_access"
      ON public.assistant_access FOR SELECT
      USING (public.is_admin())';
  END IF;
END $$;

-- Delete confirmed orphan event + project. Safe defaults: if the ids no longer
-- exist (already cleaned up manually) the DELETE is a no-op.
DELETE FROM public.events
WHERE id = 'bb19931d-b7c8-4095-8c4b-f2fb99f7307b';

DELETE FROM public.projects
WHERE id = 'd899df0b-b987-4308-8846-85afd4a77587';

COMMIT;
