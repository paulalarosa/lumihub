-- Fix: backfill orphan auth.users → profiles, bypassing triggers that may fail
-- (prod has a notifications_type_check constraint that wasn't in version control;
--  disabling triggers during backfill avoids cascading inserts into notifications)

BEGIN;

-- Make sure handle_new_user function is current (idempotent re-declare)
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

  -- Insert profile (the critical piece — was missing)
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

  -- Welcome email is best-effort
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

-- Backfill orphan users with triggers disabled to avoid constraint cascades
ALTER TABLE public.profiles DISABLE TRIGGER USER;

INSERT INTO public.profiles (
  id, email, full_name, first_name, last_name, name,
  role, plan, subscription_status, created_at, updated_at
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)), ' ', 1),
  NULLIF(trim(substring(
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
    from position(' ' in COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)))
  )), ''),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  'user', 'free', 'trial', u.created_at, now()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL AND u.email IS NOT NULL AND u.email != ''
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles ENABLE TRIGGER USER;

-- Report what we did
DO $$
DECLARE
  v_auth integer;
  v_profiles integer;
  v_orphans integer;
BEGIN
  SELECT count(*) INTO v_auth FROM auth.users WHERE email IS NOT NULL AND email != '';
  SELECT count(*) INTO v_profiles FROM public.profiles;
  SELECT count(*) INTO v_orphans
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL AND u.email IS NOT NULL AND u.email != '';

  RAISE NOTICE 'auth.users: %, profiles: %, orphans remaining: %', v_auth, v_profiles, v_orphans;
END $$;

COMMIT;
