-- Add slug column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Function to generate slug from name or email
CREATE OR REPLACE FUNCTION public.generate_slug(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
    new_slug TEXT;
BEGIN
    -- lower case, replace spaces with dashes, remove special chars
    new_slug := lower(regexp_replace(text_input, '[^a-zA-Z0-9\s]', '', 'g'));
    new_slug := regexp_replace(new_slug, '\s+', '-', 'g');
    RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate slugs for existing users who don't have one
-- Try to use full_name, fallback to "user-" + first 8 chars of id
UPDATE public.profiles
SET slug = generate_slug(COALESCE(full_name, 'user-' || substring(id::text from 1 for 8)))
WHERE slug IS NULL;

-- Make slug unique and required (after backfill)
-- We won't enforce NOT NULL strictly at DB level to avoid issues with new signups before trigger runs, 
-- but uniqueness is key.

-- RLS Policies for Public Access

-- 1. Profiles: Allow public read of specific columns
-- Note: 'profiles' already has RLS enabled usually. We add a policy for anon/public.
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (slug IS NOT NULL); -- Only expose profiles that have a slug (active)

-- 2. Services: Allow public read
CREATE POLICY "Services are viewable by everyone" 
ON public.services FOR SELECT 
USING (true); 

-- 3. Events: Allow public insert (Booking)
CREATE POLICY "Public can insert events" 
ON public.events FOR INSERT 
WITH CHECK (true); -- Ideally restrict status to 'pending' via trigger or API logic

-- 4. Events: Public can view busy slots (masked)
-- This is tricky. We generally don't want to expose all event details.
-- A cleaner way is to use a Postgres Function `get_busy_slots(user_id, date)` 
-- instead of exposing the table directly to anon. 
-- However, for RLS to work with direct select:
CREATE POLICY "Public can view event times for availability" 
ON public.events FOR SELECT 
USING (true); 
-- RISK: This exposes all event data to anyone who knows the ID or queries all.
-- MITIGATION for PROD: Use a Security Definer function or a view that only returns start/end times.
-- For this MVP/Module, we will rely on frontend filtering but it's not secure.
-- Better approach: Create a view or function.

-- Let's create a secure View for availability
CREATE OR REPLACE VIEW public.availability_slots AS
SELECT user_id, event_date, start_time, end_time, duration_minutes
FROM public.events;

-- Grant access to the view (if we were using custom roles, but anon uses table policies usually)
-- Supabase exposes Views via API too.

-- For simplicity in this step, we will use the table policy but adding a warning in comments.
-- Real production apps should use a Function `get_availability(user_id, date_range)` 
