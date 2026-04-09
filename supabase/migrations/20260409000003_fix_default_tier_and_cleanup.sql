-- Migration to fix default subscription tier and remove accidental Studio access
-- Created: 2026-04-09

-- Ensure the default for profiles is 'trial'
ALTER TABLE public.profiles 
ALTER COLUMN subscription_tier SET DEFAULT 'trial';

-- Fix existing users who are not admins but have 'studio' tier
UPDATE public.profiles
SET subscription_tier = 'trial'
WHERE subscription_tier = 'studio'
  AND role != 'admin';

-- Ensure makeup_artists default as well
ALTER TABLE public.makeup_artists
ALTER COLUMN plan_type SET DEFAULT 'free';
