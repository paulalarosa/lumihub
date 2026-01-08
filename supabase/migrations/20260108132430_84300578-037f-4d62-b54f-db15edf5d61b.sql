-- Add latitude and longitude columns to events table for GPS integration
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add has_pro_access column to assistants table for hybrid model (upsell)
ALTER TABLE public.assistants 
ADD COLUMN IF NOT EXISTS has_pro_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMPTZ;

-- Create assistant_notifications table for event assignment notifications
CREATE TABLE IF NOT EXISTS public.assistant_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES public.assistants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'event_assigned',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS on assistant_notifications
ALTER TABLE public.assistant_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Professional (owner) can manage notifications for their assistants
CREATE POLICY "Owners can manage assistant notifications" 
ON public.assistant_notifications 
FOR ALL 
USING (auth.uid() = user_id);

-- Policy: Assistants can view and update their own notifications
CREATE POLICY "Assistants can view their notifications" 
ON public.assistant_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.assistants a 
    WHERE a.id = assistant_notifications.assistant_id 
    AND a.assistant_user_id = auth.uid()
  )
);

CREATE POLICY "Assistants can update their notifications" 
ON public.assistant_notifications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.assistants a 
    WHERE a.id = assistant_notifications.assistant_id 
    AND a.assistant_user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assistant_notifications_assistant_id ON public.assistant_notifications(assistant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_notifications_event_id ON public.assistant_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_events_coordinates ON public.events(latitude, longitude) WHERE latitude IS NOT NULL;