-- Add role column to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'admin';
    END IF;
END $$;

-- Update specific users to have admin role and studio tier
UPDATE public.profiles 
SET role = 'admin', subscription_tier = 'studio' 
WHERE email IN ('nathaliasbrb@gmail.com', 'prenata@gmail.com');

-- Ensure RLS allows reading own role (if not already covered)
-- Assuming existing "Users can view own profile" policy covers this.
