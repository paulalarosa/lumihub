-- Revoke the insecure public policy
DROP POLICY IF EXISTS "Public can view event times for availability" ON public.events;

-- Create a secure function to fetch availability
-- Only returns distinct time slots, not full event details
CREATE OR REPLACE FUNCTION public.get_day_availability(
  target_slug TEXT,
  query_date DATE
)
RETURNS TABLE (
  start_time TEXT,
  end_time TEXT,
  duration_minutes INTEGER
)
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin) to bypass RLS on events
SET search_path = public -- Secure search path
LANGUAGE plpgsql
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- 1. Get user_id from slug
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE slug = target_slug;

  IF target_user_id IS NULL THEN
    RETURN; -- Return empty if user not found
  END IF;

  -- 2. Return busy slots for that user and date
  RETURN QUERY
  SELECT 
    e.start_time,
    e.end_time,
    e.duration_minutes
  FROM public.events e
  WHERE 
    e.user_id = target_user_id 
    AND e.event_date = query_date;
END;
$$;

-- Grant execution to public (anon) and authenticated users
GRANT EXECUTE ON FUNCTION public.get_day_availability(TEXT, DATE) TO anon, authenticated;
