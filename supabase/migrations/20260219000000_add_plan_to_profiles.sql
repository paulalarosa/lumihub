-- Add plan_type and stripe_customer_id to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='plan_type') THEN
        ALTER TABLE public.profiles ADD COLUMN plan_type text DEFAULT 'essencial';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stripe_customer_id') THEN
        ALTER TABLE public.profiles ADD COLUMN stripe_customer_id text;
    END IF;

    -- Add check constraint for plan_type if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_plan_type_check') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_type_check CHECK (plan_type IN ('essencial', 'profissional', 'studio'));
    END IF;
END $$;
