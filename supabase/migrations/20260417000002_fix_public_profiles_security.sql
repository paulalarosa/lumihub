-- Fix Security Definer View for public_profiles
-- Redefines the view with security_invoker = true to respect RLS and follow security best practices

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
    id,
    full_name,
    business_name,
    bio,
    avatar_url,
    logo_url,
    slug,
    city,
    state,
    website
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON TABLE public.public_profiles TO anon;
GRANT SELECT ON TABLE public.public_profiles TO authenticated;
GRANT SELECT ON TABLE public.public_profiles TO service_role;
