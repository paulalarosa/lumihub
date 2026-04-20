-- Daily digest cron: runs every day at 07:00 BRT (10:00 UTC) and calls daily-digest Edge Function.
-- Reuses invoke_edge_function helper from instagram cron setup (vault-based).

select cron.unschedule('khk_daily_digest') where exists (
  select 1 from cron.job where jobname = 'khk_daily_digest'
);

select cron.schedule(
  'khk_daily_digest',
  '0 10 * * *',  -- 10:00 UTC daily = 07:00 BRT
  $$ select public.invoke_edge_function('daily-digest', '{}'::jsonb); $$
);
