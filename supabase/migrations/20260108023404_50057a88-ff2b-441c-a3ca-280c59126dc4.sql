-- Fix permissive RLS policy for notification_logs
DROP POLICY IF EXISTS "Service role can insert notification logs" ON public.notification_logs;

-- Create proper policy that only allows the user to insert their own logs
CREATE POLICY "Users can create their own notification logs" 
ON public.notification_logs FOR INSERT WITH CHECK (auth.uid() = user_id);