-- Admin visibility: grant SELECT on all domain rows when caller is_admin().
--
-- Context: the admin panel lists every maquiadora, assistente e noiva do
-- sistema. The AdminAssistants/AdminUsers queries already ask without filter,
-- but RLS on `assistants` restricts reads to `user_id = auth.uid()` or to
-- professionals linked via makeup_artists. That blocks admins from seeing
-- rows they don't own.
--
-- RLS is OR'd per-operation, so adding these policies does NOT relax
-- existing restrictions for non-admins. The is_admin() helper already
-- exists (base_schema.sql).

BEGIN;

-- Guard: only run if is_admin() helper exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    RAISE EXCEPTION 'public.is_admin() function missing — admin policies require it';
  END IF;
END $$;

-- assistants: admins see all rows
DROP POLICY IF EXISTS "admins_select_all_assistants" ON public.assistants;
CREATE POLICY "admins_select_all_assistants"
  ON public.assistants FOR SELECT
  USING (public.is_admin());

-- wedding_clients: admins see all noivas across every maquiadora
DROP POLICY IF EXISTS "admins_select_all_wedding_clients" ON public.wedding_clients;
CREATE POLICY "admins_select_all_wedding_clients"
  ON public.wedding_clients FOR SELECT
  USING (public.is_admin());

-- profiles: admins already often have broad access via other policies, but
-- make it explicit to avoid regression if those change later.
DROP POLICY IF EXISTS "admins_select_all_profiles" ON public.profiles;
CREATE POLICY "admins_select_all_profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- makeup_artists: admins see every studio/professional
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'makeup_artists' AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "admins_select_all_makeup_artists" ON public.makeup_artists';
    EXECUTE 'CREATE POLICY "admins_select_all_makeup_artists"
      ON public.makeup_artists FOR SELECT
      USING (public.is_admin())';
  END IF;
END $$;

COMMIT;
