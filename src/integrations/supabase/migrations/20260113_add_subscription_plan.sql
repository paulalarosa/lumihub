-- Add plan column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- Function to handle plan updates (optional, for webhooks later)
-- For now, default is 'free'. 'pro' or 'empire' will be set manually or via later integration.

-- Ensure we can access created_at? 
-- Usually we use auth.users.created_at, but access to that from client is via getSession().
-- If we want to query it via SQL/RLS, we might want it in profiles.
-- Let's check if profiles has created_at. If not, add it and backfill from auth.users (if possible) or just default to NOW.
-- Since we can't easily access auth.users in a migration for backfill reliably without extra permissions,
-- we will just add the column if missing. The Hook will prioritize auth.user.created_at anyway.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
