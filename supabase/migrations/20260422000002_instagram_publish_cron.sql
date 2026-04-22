-- Cron que dispara instagram-publish-post quando scheduled_for chega.
-- Sem isso, posts agendados no PostScheduler entram na tabela com status='scheduled'
-- mas ninguém efetivamente publica.
--
-- Roda a cada 5 minutos. Edge function `instagram-publish-post` já cuida de
-- marcar status='publishing' antes do POST pro Graph API e 'published'/'failed'
-- no fim.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
DECLARE
  job_id bigint;
BEGIN
  FOR job_id IN
    SELECT jobid FROM cron.job WHERE jobname = 'khk_publish_scheduled_posts'
  LOOP
    PERFORM cron.unschedule(job_id);
  END LOOP;
END $$;

SELECT cron.schedule(
  'khk_publish_scheduled_posts',
  '*/5 * * * *',
  $$
  SELECT public.invoke_edge_function(
    'instagram-publish-post',
    jsonb_build_object('scheduled_post_id', id)
  )
  FROM public.instagram_scheduled_posts
  WHERE status = 'scheduled'
    AND scheduled_for <= now();
  $$
);

COMMIT;
