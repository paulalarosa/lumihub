-- 1. Add parent_user_id to profiles (Links assistant to owner)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_user_id UUID REFERENCES auth.users(id);

-- 2. Helper function to get the "Owner" ID for the current user
-- Returns NULL if user is an Owner (independent)
-- Returns UUID if user is an Assistant
CREATE OR REPLACE FUNCTION public.get_my_owner_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT parent_user_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Assistant Invites Table
CREATE TABLE IF NOT EXISTS public.assistant_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'assistant' NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  token UUID DEFAULT gen_random_uuid() NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked'))
);

-- RLS for Invites
ALTER TABLE public.assistant_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view sent invites"
ON public.assistant_invites FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert invites"
ON public.assistant_invites FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update invites"
ON public.assistant_invites FOR UPDATE
USING (auth.uid() = owner_id);

-- 4. UPDATE RLS for Main Tables (Clients, Events, Projects)
-- We need to drop old policies and add new ones that include "OR user_id = get_my_owner_id()"

-- CLIENTS
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

CREATE POLICY "Team access clients (select)"
ON public.clients FOR SELECT
USING (user_id = auth.uid() OR user_id = public.get_my_owner_id());

CREATE POLICY "Team access clients (insert)"
ON public.clients FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id = public.get_my_owner_id());

CREATE POLICY "Team access clients (update)"
ON public.clients FOR UPDATE
USING (user_id = auth.uid() OR user_id = public.get_my_owner_id());

CREATE POLICY "Team access clients (delete)"
ON public.clients FOR DELETE
USING (user_id = auth.uid() OR user_id = public.get_my_owner_id());

-- EVENTS (Note: Public Insert policy for booking remains separate)
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

CREATE POLICY "Team access events (select)"
ON public.events FOR SELECT
USING (user_id = auth.uid() OR user_id = public.get_my_owner_id());

CREATE POLICY "Team access events (insert)"
ON public.events FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id = public.get_my_owner_id());

CREATE POLICY "Team access events (update)"
ON public.events FOR UPDATE
USING (user_id = auth.uid() OR user_id = public.get_my_owner_id());

CREATE POLICY "Team access events (delete)"
ON public.events FOR DELETE
USING (user_id = auth.uid() OR user_id = public.get_my_owner_id());

-- PROJECTS
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

CREATE POLICY "Team access projects (select)"
ON public.projects FOR SELECT
USING (user_id = auth.uid() OR user_id = public.get_my_owner_id());

CREATE POLICY "Team access projects (insert)"
ON public.projects FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id = public.get_my_owner_id());

CREATE POLICY "Team access projects (update)"
ON public.projects FOR UPDATE
USING (user_id = auth.uid() OR user_id = public.get_my_owner_id());

CREATE POLICY "Team access projects (delete)"
ON public.projects FOR DELETE
USING (user_id = auth.uid() OR user_id = public.get_my_owner_id());
