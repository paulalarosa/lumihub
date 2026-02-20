-- Add missing status column to transactions table if it doesn't exist
ALTER TABLE IF EXISTS public.transactions
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed';

-- Grant access to newly created tables so PostgREST can see them
GRANT ALL ON TABLE public.user_onboarding TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.achievements TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_achievements TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_ai_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.contextual_tips TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_seen_tips TO anon, authenticated, service_role;

-- Force postgrest cache reload
NOTIFY pgrst, 'reload schema';
