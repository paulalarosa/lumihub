-- Run this in Supabase SQL Editor to enable full settings features

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#000000';

-- 2. Create payment_accounts table
CREATE TABLE IF NOT EXISTS public.payment_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    pix_key_type text,
    pix_key text,
    bank_name text,
    bank_code text,
    account_type text,
    agency text,
    account_number text,
    account_holder_name text,
    account_holder_document text,
    digital_wallet_type text,
    digital_wallet_account text,
    preferred_method text DEFAULT 'pix',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. Enable RLS
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "Users can view their own payment account" 
ON public.payment_accounts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment account" 
ON public.payment_accounts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment account" 
ON public.payment_accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);
