-- LGPD Art. 18 II — direito à eliminação.
-- Defensive: in prod the table may pre-exist with a different schema.

create table if not exists public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade
);

alter table public.data_deletion_requests
  add column if not exists user_email text;
alter table public.data_deletion_requests
  add column if not exists reason text;
alter table public.data_deletion_requests
  add column if not exists status text not null default 'pending';
alter table public.data_deletion_requests
  add column if not exists requested_at timestamptz not null default now();
alter table public.data_deletion_requests
  add column if not exists scheduled_for timestamptz;
alter table public.data_deletion_requests
  add column if not exists executed_at timestamptz;
alter table public.data_deletion_requests
  add column if not exists cancelled_at timestamptz;

alter table public.data_deletion_requests
  drop constraint if exists data_deletion_requests_status_check;
alter table public.data_deletion_requests
  add constraint data_deletion_requests_status_check
  check (status = any (array['pending', 'scheduled', 'executed', 'cancelled']));

create index if not exists data_deletion_requests_user_idx
  on public.data_deletion_requests (user_id);

create index if not exists data_deletion_requests_status_scheduled_idx
  on public.data_deletion_requests (status, scheduled_for)
  where status = 'scheduled';

alter table public.data_deletion_requests enable row level security;

drop policy if exists "user manages own deletion request" on public.data_deletion_requests;
create policy "user manages own deletion request"
  on public.data_deletion_requests
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "admin reads all deletion requests" on public.data_deletion_requests;
create policy "admin reads all deletion requests"
  on public.data_deletion_requests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create or replace function public.execute_pending_deletions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted integer := 0;
  rec record;
begin
  for rec in
    select user_id from public.data_deletion_requests
    where status = 'scheduled'
      and scheduled_for <= now()
    limit 100
  loop
    update public.data_deletion_requests
      set status = 'executed', executed_at = now()
      where user_id = rec.user_id and status = 'scheduled';
    begin
      delete from auth.users where id = rec.user_id;
      deleted := deleted + 1;
    exception when others then
      update public.data_deletion_requests
        set status = 'pending'
        where user_id = rec.user_id and status = 'executed';
    end;
  end loop;
  return deleted;
end;
$$;

grant execute on function public.execute_pending_deletions() to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'khk_execute_pending_deletions') then
    perform cron.unschedule('khk_execute_pending_deletions');
  end if;
end $$;

select cron.schedule(
  'khk_execute_pending_deletions',
  '0 4 * * *',
  $$ select public.execute_pending_deletions(); $$
);
