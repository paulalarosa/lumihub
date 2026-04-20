-- Drop orphan/duplicate tables/views confirmed unused in codebase.
-- Auditoria 2026-04-20.

do $$
declare
  rel record;
  candidates text[] := array[
    'clients',
    'assistant_notifications',
    'commission_payments',
    'payment_history',
    'payouts',
    'refunds',
    'bride_access',
    'bride_access_tokens',
    'team_invites',
    'team_members',
    'user_roles',
    'user_consents',
    'user_privacy_consents',
    'chat_history',
    'google_review_sync',
    'stripe_accounts',
    'stripe_webhooks',
    'review_votes',
    'instagram_hashtag_suggestions',
    'instagram_messages',
    'instagram_post_templates',
    'backup_integrity_logs',
    'security_events',
    'lead_interactions',
    'lead_stage_history',
    'lead_tasks',
    'plan_configs'
  ];
  c text;
begin
  foreach c in array candidates loop
    select relkind, relname into rel
    from pg_class cls
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public' and cls.relname = c
    limit 1;

    if not found then
      raise notice 'skip: public.% does not exist', c;
      continue;
    end if;

    if rel.relkind = 'r' then
      execute format('drop table if exists public.%I cascade', c);
      raise notice 'dropped TABLE public.%', c;
    elsif rel.relkind = 'v' then
      execute format('drop view if exists public.%I cascade', c);
      raise notice 'dropped VIEW public.%', c;
    elsif rel.relkind = 'm' then
      execute format('drop materialized view if exists public.%I cascade', c);
      raise notice 'dropped MATERIALIZED VIEW public.%', c;
    elsif rel.relkind = 'f' then
      execute format('drop foreign table if exists public.%I cascade', c);
      raise notice 'dropped FOREIGN TABLE public.%', c;
    else
      raise notice 'skip: public.% has unexpected relkind=%', c, rel.relkind;
    end if;
  end loop;
end $$;
