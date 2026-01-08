-- Fix RLS infinite recursion between public.events and public.event_assistants

-- 1) SECURITY DEFINER helpers (bypass RLS safely and avoid recursive policy evaluation)
CREATE OR REPLACE FUNCTION public.user_owns_event(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = _event_id
      AND e.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_assistant_assigned_to_event(_event_id uuid, _assistant_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_assistants ea
    JOIN public.assistants a ON a.id = ea.assistant_id
    WHERE ea.event_id = _event_id
      AND a.assistant_user_id = _assistant_user_id
  );
$$;

-- 2) Update the events SELECT policy to use the helper (no direct RLS-dependent subqueries)
DROP POLICY IF EXISTS "Assistants can view assigned events" ON public.events;

CREATE POLICY "Assistants can view assigned events"
ON public.events
FOR SELECT
TO public
USING (
  auth.uid() = user_id
  OR public.is_assistant_assigned_to_event(id, auth.uid())
);

-- 3) Remove recursion in event_assistants policies (they currently query public.events)
DROP POLICY IF EXISTS "Users can manage event assistants" ON public.event_assistants;

CREATE POLICY "Users can manage event assistants"
ON public.event_assistants
FOR ALL
TO public
USING (public.user_owns_event(event_id, auth.uid()))
WITH CHECK (public.user_owns_event(event_id, auth.uid()));
