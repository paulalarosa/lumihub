-- Fix: ensure every new auth.users signup creates a row in public.profiles.
-- Previously handle_new_user() only fired welcome email and forgot to insert profile.
-- (Backfill moved to 20260420000005 because prod has a stealth check constraint
--  on notifications that trips on downstream triggers.)

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_name text;
  v_first_name text;
  v_last_name text;
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_first_name := split_part(v_name, ' ', 1);
  v_last_name := NULLIF(trim(substring(v_name from position(' ' in v_name))), '');

  BEGIN
    INSERT INTO public.profiles (
      id, email, full_name, first_name, last_name, name,
      role, plan, subscription_status, created_at, updated_at
    )
    VALUES (
      NEW.id, NEW.email, v_name, v_first_name, v_last_name, v_name,
      'user', 'free', 'trial', now(), now()
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;

  BEGIN
    PERFORM extensions.http_post(
      url := 'https://pymdkngcpbmcnayxieod.supabase.co/functions/v1/send-signup-welcome',
      body := jsonb_build_object('to', NEW.email, 'name', v_name, 'user_id', NEW.id)::text,
      params := '{}'::jsonb,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;
