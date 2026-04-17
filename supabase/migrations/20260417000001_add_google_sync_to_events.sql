-- Add Google Calendar sync columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_events_google_id ON public.events(google_calendar_event_id);

-- Add same columns to projects to allow project-level sync
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_google_id ON public.projects(google_calendar_event_id);
