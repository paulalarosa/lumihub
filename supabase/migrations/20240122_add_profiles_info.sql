-- Add missing columns to profiles table for Contractor data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS document_id text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;
