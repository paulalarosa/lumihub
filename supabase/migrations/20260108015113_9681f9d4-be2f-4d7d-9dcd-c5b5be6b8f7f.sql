-- Add event_type column to events table
ALTER TABLE public.events 
ADD COLUMN event_type text DEFAULT 'noivas';

-- Add comment for documentation
COMMENT ON COLUMN public.events.event_type IS 'Tipo do evento: noivas, pre_wedding, producoes_sociais';