-- Track who was contacted via marketing campaigns and when.
-- Lets the UI suppress recently-contacted clients from the list.

BEGIN;

CREATE TABLE IF NOT EXISTS public.marketing_contacts_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.wedding_clients(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'whatsapp',
  template_id text,
  template_title text,
  message_preview text,
  contacted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_contacts_log_user_idx
  ON public.marketing_contacts_log(user_id, contacted_at DESC);

CREATE INDEX IF NOT EXISTS marketing_contacts_log_client_idx
  ON public.marketing_contacts_log(client_id, contacted_at DESC);

ALTER TABLE public.marketing_contacts_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own contact logs" ON public.marketing_contacts_log;
CREATE POLICY "Users manage own contact logs"
  ON public.marketing_contacts_log FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
