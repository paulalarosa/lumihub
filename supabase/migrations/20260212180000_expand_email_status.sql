-- Migration to expand email_status tracking to leads and assistant_invites

-- 1. Update leads table: Ensure email column exists before tracking status
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'verified' CHECK (email_status IN ('verified', 'invalid', 'unsubscribed'));

-- 2. Update assistant_invites table
ALTER TABLE public.assistant_invites
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'verified' CHECK (email_status IN ('verified', 'invalid', 'unsubscribed'));

-- 3. Add indexes for efficient deliverability checks
CREATE INDEX IF NOT EXISTS idx_leads_email_status ON public.leads(email, email_status);
CREATE INDEX IF NOT EXISTS idx_assistant_invites_email_status ON public.assistant_invites(assistant_email, email_status);

-- 4. Audit log
INSERT INTO notification_logs (status, error_message)
VALUES ('success', 'Expanded email_status tracking to leads and assistant_invites');
