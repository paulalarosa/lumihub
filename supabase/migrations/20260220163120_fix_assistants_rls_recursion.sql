-- Fix infinite recursion on assistants and assistant_access policies

-- 1. Drop the problematic policies on `assistants`
DROP POLICY IF EXISTS "Employers can view their assistants" ON public.assistants;
DROP POLICY IF EXISTS "Assistants can manage own profile" ON public.assistants;

-- 2. Drop the problematic policies on `assistant_access` that might cause circular dependency
DROP POLICY IF EXISTS "Makeup artists can view their assistants" ON public.assistant_access;
DROP POLICY IF EXISTS "Assistants can view their connections" ON public.assistant_access;


-- 3. Recreate policies for `assistants` using a simpler, direct approach to avoid recursion
-- An assistant can see their own record
CREATE POLICY "Assistants can view own profile" 
ON public.assistants 
FOR SELECT 
USING (user_id = auth.uid());

-- An employer (makeup artist) can see assistants they have an active connection with.
-- To avoid recursion, we don't query the `makeup_artists` table if we don't strictly have to, 
-- or we use the `id` directly if we can, but since `assistant_access` uses `makeup_artist_id`, 
-- we need a direct lookup that doesn't trigger another policy check loop.
CREATE POLICY "Employers can view their connected assistants" 
ON public.assistants 
FOR SELECT 
USING (
  id IN (
    SELECT assistant_id 
    FROM public.assistant_access 
    WHERE makeup_artist_id IN (
      SELECT id FROM public.makeup_artists WHERE user_id = auth.uid()
    )
    AND status = 'active'
  )
);

-- 4. Recreate policies for `assistant_access` using `user_id` direct checks where possible
CREATE POLICY "Makeup artists can view their own access records" 
ON public.assistant_access 
FOR SELECT 
USING (
  makeup_artist_id IN (
    SELECT id FROM public.makeup_artists WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Assistants can view access records directed to them" 
ON public.assistant_access 
FOR SELECT 
USING (
  assistant_id IN (
    SELECT id FROM public.assistants WHERE user_id = auth.uid()
  )
);

-- Re-enable Assistants managing their own profile
CREATE POLICY "Assistants can manage own profile" 
ON public.assistants 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());
