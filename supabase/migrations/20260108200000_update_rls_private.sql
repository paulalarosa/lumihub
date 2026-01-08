-- Update RLS policies for profiles and contracts to private
-- Remove admin access policies to make them fully private

-- For profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- For contracts table (already tightened, but ensure no public access)
DROP POLICY IF EXISTS "Public can view contracts via project token" ON public.contracts;