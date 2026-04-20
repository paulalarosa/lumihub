-- OAuth CSRF state (short-lived, single-use)
create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_token text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  code_verifier text,                    -- PKCE (nullable for confidential clients)
  redirect_uri text,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists oauth_states_token_idx on public.oauth_states (state_token);
create index if not exists oauth_states_expires_idx on public.oauth_states (expires_at);

alter table public.oauth_states enable row level security;

-- No public RLS; only service role reads/writes
create policy "service role full access"
  on public.oauth_states
  for all
  to service_role
  using (true)
  with check (true);

-- Cleanup old states (pg_cron friendly)
create or replace function public.cleanup_expired_oauth_states()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted integer;
begin
  with d as (
    delete from public.oauth_states
    where expires_at < now() - interval '1 hour'
       or consumed_at is not null and consumed_at < now() - interval '24 hours'
    returning 1
  )
  select count(*) into deleted from d;
  return deleted;
end;
$$;

-- RISC events audit (Cross-Account Protection from Google)
create table if not exists public.risc_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  subject_id text,
  subject_email text,
  issued_at timestamptz,
  received_at timestamptz not null default now(),
  raw_payload jsonb not null,
  acted_on boolean not null default false,
  action_taken text
);

create index if not exists risc_events_type_idx on public.risc_events (event_type);
create index if not exists risc_events_subject_idx on public.risc_events (subject_email);
create index if not exists risc_events_received_idx on public.risc_events (received_at desc);

alter table public.risc_events enable row level security;

create policy "admins read risc_events"
  on public.risc_events
  for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- RPC: revoke all Google integrations for a user (called when RISC fires)
create or replace function public.revoke_google_integration_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.google_calendar_tokens where user_id = p_user_id;
  delete from public.user_integrations where user_id = p_user_id and provider = 'google';
end;
$$;

grant execute on function public.revoke_google_integration_for_user(uuid) to service_role;
