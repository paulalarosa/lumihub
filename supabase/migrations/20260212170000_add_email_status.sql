-- Migration to add email_status tracking for SES/SNS

-- Add email_status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_status text DEFAULT 'verified';

-- Add email_status to wedding_clients
ALTER TABLE public.wedding_clients 
ADD COLUMN IF NOT EXISTS email_status text DEFAULT 'verified';

-- Create an index for faster lookups during webhook processing
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_wedding_clients_email ON public.wedding_clients(email);
-- Add email_status tracking to notification_logs
ALTER TABLE public.notification_logs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS recipient TEXT,
ADD COLUMN IF NOT EXISTS provider_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON public.notification_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
