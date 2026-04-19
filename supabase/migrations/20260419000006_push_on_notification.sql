-- Call the send-push-notification Edge Function asynchronously whenever
-- a new in-app notification is inserted. Uses pg_net (Supabase default).
-- Fails silently if VAPID not configured — in-app bell still works.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.send_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_project_ref text;
  v_url text;
  v_service_key text;
BEGIN
  v_project_ref := current_setting('app.settings.project_ref', true);
  v_service_key := current_setting('app.settings.service_role_key', true);

  IF v_project_ref IS NULL OR v_service_key IS NULL THEN
    v_project_ref := 'nqufpfpqtycxxqtnkkfh';
  END IF;

  v_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/send-push-notification';

  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM extensions.http_post(
    url := v_url,
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', NEW.message,
      'url', COALESCE(NEW.action_url, '/dashboard')
    )::text,
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_service_key, '')
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_notification_push ON public.notifications;
CREATE TRIGGER on_notification_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_push_on_notification();

COMMIT;
