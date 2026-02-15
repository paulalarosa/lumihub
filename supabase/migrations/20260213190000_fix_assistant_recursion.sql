-- FIX INFINITE RECURSION IN ASSISTANTS TABLE RLS
-- The error "infinite recursion detected in policy for relation assistants"
-- usually happens when a policy on assistants refers back to assistants in its USING or WITH CHECK clause.

-- Ensure RLS is enabled
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;

-- DROP OLD POLICIES
DROP POLICY IF EXISTS "Assistants can view their own profile" ON public.assistants;
DROP POLICY IF EXISTS "Makeup artists can view their assistants" ON public.assistants;
DROP POLICY IF EXISTS "System can manage assistants" ON public.assistants;

-- 1. ADVERTISER/ASSISTANT can see their own data
-- We use auth.uid() directly against user_id to avoid recursion.
CREATE POLICY "Assistants can view their own profile" 
ON public.assistants FOR SELECT 
USING (auth.uid() = user_id);

-- 2. MAKEUP ARTISTS can see assistants that have granted access to them
-- To avoid recursion, we check assistant_access instead of joining back to assistants.
CREATE POLICY "Makeup artists can view their assistants" 
ON public.assistants FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.assistant_access aa
    JOIN public.makeup_artists ma ON ma.id = aa.makeup_artist_id
    WHERE aa.assistant_id = public.assistants.id
    AND ma.user_id = auth.uid()
    AND aa.status = 'active'
  )
);

-- 3. PERMIT INSERT/UPDATE for own profile
CREATE POLICY "Assistants can manage their own profile" 
ON public.assistants FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Standardize relationships (if missing)
-- Ensure projects table uses wedding_clients correctly.
-- Looking at the error "Could not find a relationship between projects and clients"
-- It's likely because code is using clients(*) instead of wedding_clients(*)

COMMENT ON TABLE public.wedding_clients IS 'Real table for clients, aliased as clients in some views';
