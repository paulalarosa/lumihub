-- Add missing columns to clients (wedding_clients) table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS is_bride BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_pin TEXT,
ADD COLUMN IF NOT EXISTS portal_link TEXT;

-- Verify if RLS allows update to these columns (Owner policy allows checking everything usually)
-- But explicit granting is not needed for columns if table policy covers it.
