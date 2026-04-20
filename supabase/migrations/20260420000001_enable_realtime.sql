-- Enable realtime publication on domain tables.
-- Required for client-side supabase.channel().on('postgres_changes', ...) to receive events.

-- Helper: add table to publication if not already in it
do $$
declare
  t text;
  tables text[] := array[
    'profiles',
    'wedding_clients',
    'events',
    'invoices',
    'projects',
    'contracts',
    'makeup_artists',
    'assistants',
    'notifications',
    'workflows',
    'workflow_executions',
    'tasks',
    'pipeline_stages',
    'leads',
    'lead_stage_history',
    'lead_interactions',
    'lead_tasks',
    'calendar_events',
    'signature_requests',
    'project_services',
    'services',
    'payments',
    'audit_logs',
    'system_logs'
  ];
begin
  foreach t in array tables loop
    -- skip if table does not exist
    if not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t and c.relkind = 'r'
    ) then
      raise notice 'skip: table public.% does not exist', t;
      continue;
    end if;

    -- skip if already in publication
    if exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      raise notice 'skip: public.% already in supabase_realtime', t;
      continue;
    end if;

    execute format('alter publication supabase_realtime add table public.%I', t);

    -- Set REPLICA IDENTITY FULL so UPDATE/DELETE events include full row (not just pk)
    execute format('alter table public.%I replica identity full', t);

    raise notice 'added: public.%', t;
  end loop;
end $$;
