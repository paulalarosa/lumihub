-- Create analytics_logs table
CREATE TABLE IF NOT EXISTS public.analytics_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    details JSONB
);

-- Enable RLS just in case, though mostly backend accessed
ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert by service role and authenticated functions
CREATE POLICY "Service Insert" ON public.analytics_logs FOR INSERT TO service_role, postgres, anon, authenticated WITH CHECK (true);

-- Update validate_bride_pin to log access
CREATE OR REPLACE FUNCTION public.validate_bride_pin(client_id uuid, pin_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_pin text;
  is_valid boolean;
BEGIN
  -- Get the PIN for the client
  SELECT access_pin INTO stored_pin
  FROM public.clients
  WHERE id = client_id;
  
  -- Compare
  IF stored_pin IS NOT NULL AND stored_pin = pin_code THEN
    is_valid := true;
    
    -- Log the successful login
    INSERT INTO public.analytics_logs (event_type, client_id, details)
    VALUES ('portal_login', client_id, jsonb_build_object('success', true));
    
  ELSE
    is_valid := false;
  END IF;
  
  RETURN is_valid;
END;
$$;
