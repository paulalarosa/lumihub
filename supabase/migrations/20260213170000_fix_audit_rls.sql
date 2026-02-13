-- Phase 54: Audit RLS Fix
-- Resolve 403 Forbidden error (42501) on audit_logs table

-- Ensure RLS is enabled
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own logs
-- Users need to log their own 'USER_SIGN_IN' and other actions.
-- We allow insertion for authenticated users.
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.audit_logs;
CREATE POLICY "Allow authenticated insert" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow admins/studio owners to view audit logs
DROP POLICY IF EXISTS "Allow admin select" ON public.audit_logs;
CREATE POLICY "Allow admin select" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'studio')
  )
);

-- Also fix system_logs for consistency if it uses same pattern
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated insert system_logs" ON public.system_logs;
CREATE POLICY "Allow authenticated insert system_logs" ON public.system_logs
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin select system_logs" ON public.system_logs;
CREATE POLICY "Allow admin select system_logs" ON public.system_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'studio')
  )
);
