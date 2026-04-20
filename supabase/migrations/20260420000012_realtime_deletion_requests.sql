-- Add data_deletion_requests to realtime publication so admin activity panel
-- receives live updates when LGPD deletion requests are created/cancelled/executed.

do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'data_deletion_requests' and c.relkind = 'r'
  ) then
    raise notice 'skip: table public.data_deletion_requests does not exist';
    return;
  end if;

  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'data_deletion_requests'
  ) then
    raise notice 'skip: public.data_deletion_requests already in supabase_realtime';
    return;
  end if;

  alter publication supabase_realtime add table public.data_deletion_requests;
  alter table public.data_deletion_requests replica identity full;

  raise notice 'added: public.data_deletion_requests';
end $$;
