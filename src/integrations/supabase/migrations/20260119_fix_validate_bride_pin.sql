-- Migration to unify PIN usage to 'access_pin' and update validation logic
-- 1. Migrate legacy data if 'secret_code' exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'secret_code') THEN
        -- Move data from secret_code to access_pin if access_pin is empty
        UPDATE public.clients 
        SET access_pin = secret_code 
        WHERE (access_pin IS NULL OR access_pin = '') AND secret_code IS NOT NULL;
    END IF;
END $$;

-- 2. Drop legacy function if it exists (to avoid signature conflicts or stale logic)
DROP FUNCTION IF EXISTS public.validate_bride_pin(uuid, text);

-- 3. Recreate validate_bride_pin to use 'access_pin'
CREATE OR REPLACE FUNCTION public.validate_bride_pin(client_id uuid, pin_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_pin text;
BEGIN
  -- Get the PIN for the client
  SELECT access_pin INTO stored_pin
  FROM public.clients
  WHERE id = client_id;
  
  -- Compare
  IF stored_pin IS NOT NULL AND stored_pin = pin_code THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;
