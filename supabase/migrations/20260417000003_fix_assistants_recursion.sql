-- Migration: Fix infinite recursion on assistants and assistant_access tables
-- Created: 2026-04-17
-- Reason: Error 42P17 (infinite recursion) detected in RLS policies for 'assistants' table.

-- 1. Create SECURITY DEFINER functions to break the recursion chain
-- These functions execute with the privileges of the creator (postgres) 
-- and bypass RLS on the tables they query.

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

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "Employers can view their assistants" ON public.assistants;
DROP POLICY IF EXISTS "Assistants can view their connections" ON public.assistant_access;

-- 3. Recreate policies using the SECURITY DEFINER functions
CREATE POLICY "Employers can view their assistants"
ON public.assistants
FOR SELECT
TO authenticated
USING (public.check_is_employer_of(id));

CREATE POLICY "Assistants can view their connections"
ON public.assistant_access
FOR SELECT
TO authenticated
USING (public.check_is_assistant_of(makeup_artist_id));

-- 4. Add policy for assistants to view their own profile (already exists but ensuring it's not blocked)
-- CREATE POLICY "Assistants can view own profile" ON public.assistants FOR SELECT USING (user_id = auth.uid());
-- This one is fine as it only checks user_id.

-- 5. Grant permissions to the functions
GRANT EXECUTE ON FUNCTION public.check_is_employer_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_assistant_of(uuid) TO authenticated;
