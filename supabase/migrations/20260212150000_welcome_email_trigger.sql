-- Migration to setup Welcome Email Trigger via AWS SES

-- 1. Create a function to call the send-ses-email Edge Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url text;
  service_role_key text;
  response_status int;
  response_body text;
BEGIN
  -- Get the Edge Function URL and Service Role Key from vault or hardcoded if necessary
  -- Ideally these should be in a secure store, but for this instance we assume standard Supabase setup
  -- REPLACE WITH YOUR PROJECT URL IF DIFFERENT
  edge_function_url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-ses-email';
  
  -- Note: We can't easily get the service role key here without extension support or vaulted secrets.
  -- A common pattern is to use the anon key if RLS allows, or rely on internal networking if self-hosted.
  -- However, since this is a trigger on auth.users (superuser), we need to be careful.
  -- Alternatively, we can insert into a 'notification_queue' table and have an Edge Function process it.
  -- BUT, to keep it simple as per request to "trigger on signup":
  
  -- We will use pg_net if available (Supabase standard) to call the function
  -- We need to pass the Service Role Key to authorize strictly.
  -- SINCE WE CANNOT ACCESS SECRETS SECURELY IN PLAIN SQL WITHOUT VAULT:
  -- We will assume the Edge Function is protected but we might need to open it up or use a specific reliable internal header.
  
  -- BEST PRACTICE ALTERNATIVE FOR SUPABASE:
  -- Insert into a public.user_profiles or similar table is usually what triggers the welcome email in many apps.
  -- But here we want to trigger on auth.users.
  
  -- Let's try to perform the request. 
  -- We'll assume the function is accessible with the ANON key for this specific route if we can't get SERVICE_ROLE.
  -- OR we hardcode the Service Key in the migration if the user provides it (NOT RECOMMENDED).
  
  -- BETTER APPROACH:
  -- We will use `net.http_post` extension.
  -- We need to know the Project Ref/URL. 
  
  -- SIMPLIFIED TRIGGER LOGIC:
  -- Since calling Edge Functions from Database Triggers directly can be flaky due to timeouts/auth,
  -- a robust way is to just let the client handle it OR use a separate "job" table.
  
  -- However, to fulfill "Trigger: Signup" in backend:
  -- We will insert a log into `notification_logs` with status 'pending' and type 'welcome_email'.
  -- THEN we need a way to process it. 
  
  -- WAIT, the prompt asked to "integrate logic to trigger variables". 
  -- The most robust backend-only way without external cron is a Database Webhook.
  -- But Supabase Database Webhooks (UI feature) are deprecated in favor of Edge Functions.
  -- We can use a Postgres Trigger calling an Edge Function.
  
  -- Let's write the trigger to call the function using `net.http_post`.
  -- We will assume `net` extension is enabled.

  perform net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-ses-email', -- PLACEHOLDER, needs update
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer <SERVICE_ROLE_KEY>' -- PLACEHOLDER
      ),
      body := jsonb_build_object(
          'to', jsonb_build_array(new.email),
          'template', 'Khaos_Welcome',
          'templateData', jsonb_build_object(
              'name', COALESCE(new.raw_user_meta_data->>'name', 'Cliente'),
              'email', new.email
          ),
          'userId', new.id
      )
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON auth.users;
CREATE TRIGGER on_auth_user_created_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
