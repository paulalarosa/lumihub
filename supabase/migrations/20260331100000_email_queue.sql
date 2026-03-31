-- Create email_queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_to TEXT NOT NULL,
  template TEXT NOT NULL,
  template_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance on the function query
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON public.email_queue(status, scheduled_for) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Policies: only the service role needs to read/update, but apps/triggers might need to insert
CREATE POLICY "Users can insert their own email queue items" 
ON public.email_queue FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own email queue items" 
ON public.email_queue FOR SELECT 
USING (auth.uid() = user_id);

-- Add cron job to process email queue every minute
SELECT cron.schedule(
  'process-email-queue',
  '* * * * *', -- Every 1 minute
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
