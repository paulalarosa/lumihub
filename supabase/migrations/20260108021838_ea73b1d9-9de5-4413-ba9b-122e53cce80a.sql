-- Remove the OLD "Assistants can view assigned events" policy that still has the recursive EXISTS
-- We need to recreate it using the security definer function

DROP POLICY IF EXISTS "Assistants can view assigned events" ON public.events;
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;

-- Recreate a single SELECT policy that uses the security definer function
CREATE POLICY "Users and assistants can view events"
ON public.events
FOR SELECT
TO public
USING (
  auth.uid() = user_id
  OR public.is_assistant_assigned_to_event(id, auth.uid())
);

-- Also fix event_assistants - drop the old recursive policy and recreate using security definer
DROP POLICY IF EXISTS "Users can manage event assistants" ON public.event_assistants;

CREATE POLICY "Users can manage event assistants"
ON public.event_assistants
FOR ALL
TO public
USING (public.user_owns_event(event_id, auth.uid()))
WITH CHECK (public.user_owns_event(event_id, auth.uid()));