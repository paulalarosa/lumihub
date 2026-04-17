-- Migration: Comprehensive Fix for Assistants Recursion (V2)
-- Created: 2026-04-17
-- Reason: Final resolution for Error 42P17 (infinite recursion) between assistants and assistant_access.

-- 1. Create or Replace SECURITY DEFINER functions to break the recursion chain
-- These bypass RLS during the check.

CREATE OR REPLACE FUNCTION public.check_is_employer_of(p_assistant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM assistant_access aa
    JOIN makeup_artists ma ON aa.makeup_artist_id = ma.id
    WHERE aa.assistant_id = p_assistant_id
      AND ma.user_id = auth.uid()
      AND aa.status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_assistant_of(p_makeup_artist_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM assistant_access aa
    JOIN assistants a ON aa.assistant_id = a.id
    WHERE aa.makeup_artist_id = p_makeup_artist_id
      AND a.user_id = auth.uid()
      AND aa.status = 'active'
  );
END;
$$;

-- 2. Drop ALL policies on assistants to ensure a clean state
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'assistants' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.assistants', pol.policyname);
    END LOOP;
END $$;

-- 3. Drop ALL policies on assistant_access to ensure a clean state
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'assistant_access' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.assistant_access', pol.policyname);
    END LOOP;
END $$;

-- 4. Create CLEAN policies for 'assistants'
CREATE POLICY "assistants_self_manage"
ON public.assistants
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "professionals_view_assistants"
ON public.assistants
FOR SELECT
TO authenticated
USING (public.check_is_employer_of(id));

CREATE POLICY "professionals_update_assistants"
ON public.assistants
FOR UPDATE
TO authenticated
USING (public.check_is_employer_of(id));

CREATE POLICY "professionals_insert_assistants"
ON public.assistants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Create CLEAN policies for 'assistant_access'
CREATE POLICY "assistants_view_connections"
ON public.assistant_access
FOR SELECT
TO authenticated
USING (public.check_is_assistant_of(makeup_artist_id));

CREATE POLICY "professionals_manage_access"
ON public.assistant_access
FOR ALL
TO authenticated
USING (
    makeup_artist_id IN (SELECT id FROM public.makeup_artists WHERE user_id = auth.uid())
)
WITH CHECK (
    makeup_artist_id IN (SELECT id FROM public.makeup_artists WHERE user_id = auth.uid())
);

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.check_is_employer_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_assistant_of(uuid) TO authenticated;
GRANT ALL ON TABLE public.assistants TO authenticated;
GRANT ALL ON TABLE public.assistant_access TO authenticated;
