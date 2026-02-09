-- Notification Logs Table
-- Tracks all email and WhatsApp notifications sent from the system

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid REFERENCES public.assistant_invites(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email', 'whatsapp')),
  recipient text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'delivered', 'read')) DEFAULT 'sent',
  
  -- Provider tracking
  provider_id text, -- Resend email_id or Twilio message_sid
  error_message text,
  
  -- Timestamps
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_notification_logs_invite ON public.notification_logs(invite_id);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX idx_notification_logs_type ON public.notification_logs(type);
CREATE INDEX idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);

-- RLS Policies
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can view notification logs for their own invites
CREATE POLICY "Users can view own notification logs"
  ON public.notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assistant_invites ai
      WHERE ai.id = notification_logs.invite_id
      AND ai.makeup_artist_id = auth.uid()
    )
  );

-- System can insert notification logs
CREATE POLICY "System can insert notification logs"
  ON public.notification_logs FOR INSERT
  WITH CHECK (true);

-- System can update notification logs (for delivery/read status)
CREATE POLICY "System can update notification logs"
  ON public.notification_logs FOR UPDATE
  USING (true);

COMMENT ON TABLE public.notification_logs IS 'Tracks all email and WhatsApp notifications sent for assistant invites';
COMMENT ON COLUMN public.notification_logs.provider_id IS 'External provider ID (Resend email_id or Twilio message_sid)';
COMMENT ON COLUMN public.notification_logs.status IS 'Notification status: sent, failed, delivered, read';
