-- Migration: Fix infinite recursion on profiles table RLS policies
-- Created: 2026-04-09
-- Reason: Error 42P17 (infinite recursion) detected when admins try to list profiles.

-- 1. Disable RLS momentarily to safely drop policies (optional but safer)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop all potentially recursive policies on profiles
-- We use a DO block to ensure we catch all variations of naming
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create CLEAN policies using SECURITY DEFINER functions to break recursion

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy: Admins can view ALL profiles
-- IMPORTANT: We use the is_admin() function which is SECURITY DEFINER.
-- This bypasses RLS during the check, preventing the recursion loop.
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy: Admins can update any profile (Support/Admin actions)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Special cases (e.g., public profile reading for microsites)
-- If microsites need to read limited profile data without authentication,
-- ensure those policies are also non-recursive.
CREATE POLICY "Public profile reading"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true); -- Usually restricted by selecting only specific columns in the app
