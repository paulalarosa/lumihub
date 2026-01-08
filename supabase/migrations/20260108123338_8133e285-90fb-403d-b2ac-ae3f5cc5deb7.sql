-- Add google_calendar_event_id to events table for bidirectional sync
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Add google_calendar_id to user_integrations for webhook channel
ALTER TABLE public.user_integrations 
ADD COLUMN IF NOT EXISTS google_channel_id TEXT,
ADD COLUMN IF NOT EXISTS google_resource_id TEXT,
ADD COLUMN IF NOT EXISTS google_channel_expiration TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_google_calendar_event_id 
ON public.events(google_calendar_event_id) 
WHERE google_calendar_event_id IS NOT NULL;