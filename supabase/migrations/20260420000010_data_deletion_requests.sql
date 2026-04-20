-- LGPD Art. 18 II — direito à eliminação dos dados pessoais.
-- Table to track deletion requests with grace period + audit trail.

create table if not exists public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  reason text,
  status text not null default 'pending' check (
    status = any (array['pending', 'scheduled', 'executed', 'cancelled'])
  ),
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz,
  executed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists data_deletion_requests_user_idx
  on public.data_deletion_requests (user_id);
create index if not exists data_deletion_requests_status_scheduled_idx
  on public.data_deletion_requests (status, scheduled_for)
  where status = 'scheduled';

alter table public.data_deletion_requests enable row level security;

create policy "user manages own deletion request"
  on public.data_deletion_requests
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

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

-- Daily cron: execute scheduled deletions past their grace period
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
    -- Mark as executed first (idempotent)
    update public.data_deletion_requests
      set status = 'executed', executed_at = now()
      where user_id = rec.user_id and status = 'scheduled';

    -- Actually delete (triggers cascades)
    begin
      delete from auth.users where id = rec.user_id;
      deleted := deleted + 1;
    exception when others then
      -- If FK blocks, revert to pending for manual resolution
      update public.data_deletion_requests
        set status = 'pending'
        where user_id = rec.user_id and status = 'executed';
    end;
  end loop;
  return deleted;
end;
$$;

grant execute on function public.execute_pending_deletions() to service_role;

-- Schedule daily at 04:00 UTC (01:00 BRT)
select cron.unschedule('khk_execute_pending_deletions')
where exists (
  select 1 from cron.job where jobname = 'khk_execute_pending_deletions'
);

select cron.schedule(
  'khk_execute_pending_deletions',
  '0 4 * * *',
  $$ select public.execute_pending_deletions(); $$
);
