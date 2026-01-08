-- Fix RLS policies for assistants table
-- Remove any permissive public access policies and ensure only authenticated owners can access

-- First, let's see what policies exist and drop any that allow public/anon access
-- Then recreate proper owner-only policies

-- Drop existing policies on assistants table
DROP POLICY IF EXISTS "Users can view their own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can create their own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can update their own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can delete their own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Assistants can view their own record" ON public.assistants;

-- Recreate secure policies for assistants (authenticated users only)
CREATE POLICY "Users can view their own assistants" 
ON public.assistants 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Assistants can view their own record" 
ON public.assistants 
FOR SELECT 
TO authenticated
USING (auth.uid() = assistant_user_id);

CREATE POLICY "Users can create their own assistants" 
ON public.assistants 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assistants" 
ON public.assistants 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assistants" 
ON public.assistants 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Fix RLS policies for payment_accounts table
-- This table contains highly sensitive financial data

-- Drop existing policies on payment_accounts table
DROP POLICY IF EXISTS "Users can view their own payment accounts" ON public.payment_accounts;
DROP POLICY IF EXISTS "Users can create their own payment accounts" ON public.payment_accounts;
DROP POLICY IF EXISTS "Users can update their own payment accounts" ON public.payment_accounts;
DROP POLICY IF EXISTS "Users can delete their own payment accounts" ON public.payment_accounts;

-- Recreate secure policies for payment_accounts (authenticated users only)
CREATE POLICY "Users can view their own payment accounts" 
ON public.payment_accounts 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment accounts" 
ON public.payment_accounts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment accounts" 
ON public.payment_accounts 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment accounts" 
ON public.payment_accounts 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);