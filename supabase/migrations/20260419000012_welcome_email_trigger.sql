-- Wire welcome email to new user signup.
-- Replaces legacy handle_new_user (which called send_templated_email/SES template
-- 'Khaos_Welcome' that never existed) with a Resend-backed version.
-- Binds the trigger to auth.users — previously the function existed but was orphaned.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_project_ref text := 'nqufpfpqtycxxqtnkkfh';
  v_url text;
  v_name text;
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  v_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/send-signup-welcome';

  PERFORM extensions.http_post(
    url := v_url,
    body := jsonb_build_object(
      'to', NEW.email,
      'name', v_name,
      'user_id', NEW.id
    )::text,
    params := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;
