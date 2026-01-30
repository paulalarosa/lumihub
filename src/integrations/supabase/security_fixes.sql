-- Security Fixes based on Supabase Advisor

-- 1. Enable RLS on tables where policies exist but RLS was disabled
-- This fixes "Policy Exists RLS Disabled" errors
ALTER TABLE public.bride_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on unprotected tables
-- This fixes "RLS Disabled in Public" errors
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Optional: Create basic policies for system_logs if not present
-- Allow authenticated users to insert logs (audit)
CREATE POLICY "Users can insert system_logs" 
ON public.system_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow users to view their own logs (if user_id exists)
-- Assuming system_logs has user_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_logs' AND column_name = 'user_id') THEN
        EXECUTE 'CREATE POLICY "Users can view own system_logs" ON public.system_logs FOR SELECT USING (auth.uid() = user_id)';
    END IF;
END $$;
