-- Fix recursive policy issue on events table
DROP POLICY IF EXISTS "Assistants can view tagged events" ON public.events;

CREATE POLICY "Assistants can view assigned events" 
ON public.events 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM event_assistants ea
    JOIN assistants a ON ea.assistant_id = a.id
    WHERE ea.event_id = events.id 
    AND a.assistant_user_id = auth.uid()
  )
);