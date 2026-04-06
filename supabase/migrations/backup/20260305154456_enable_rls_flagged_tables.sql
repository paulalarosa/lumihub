-- Using DO block with IF EXISTS checks to prevent deployment errors if tables are missing or not defined
DO $$ 
BEGIN 
    -- 1. stripe_webhooks
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stripe_webhooks') THEN
        ALTER TABLE public.stripe_webhooks ENABLE ROW LEVEL SECURITY;
        -- NOTE: stripe_webhooks is typically accessed by a secure webhook endpoint bypassing RLS via service_role,
        -- so we do not create public policies for it, leaving it fully locked down.
    END IF;
    
    -- 2. sync_log
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sync_log') THEN
        ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;
        
        -- Add basic insert policy to allow the application to write logs
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.sync_log;
        CREATE POLICY "Enable insert for authenticated users" ON public.sync_log FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    
    -- 3. achievements
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievements') THEN
        ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
        
        -- Add basic read policy for reference data
        DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.achievements;
        CREATE POLICY "Enable read access for all authenticated users" ON public.achievements FOR SELECT TO authenticated USING (true);
    END IF;
    
    -- 4. contextual_tips
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contextual_tips') THEN
        ALTER TABLE public.contextual_tips ENABLE ROW LEVEL SECURITY;
        
        -- Add basic read policy for reference data
        DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.contextual_tips;
        CREATE POLICY "Enable read access for all authenticated users" ON public.contextual_tips FOR SELECT TO authenticated USING (true);
    END IF;
END $$;
