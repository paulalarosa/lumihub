-- EMAIL SUPPRESSIONS (populated by resend-webhook on bounce/complaint)
create table if not exists public.email_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  reason text not null,
  resend_event_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_suppressions_email_idx
  on public.email_suppressions (lower(email));

alter table public.email_suppressions enable row level security;

create policy "admins read suppressions"
  on public.email_suppressions
  for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- EMAIL EVENTS (audit log of delivery events)
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  email_id text,
  recipient text not null,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_events_recipient_idx
  on public.email_events (lower(recipient));
create index if not exists email_events_type_idx
  on public.email_events (event_type);
create index if not exists email_events_created_idx
  on public.email_events (created_at desc);

alter table public.email_events enable row level security;

create policy "admins read email_events"
  on public.email_events
  for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- RPC helper: check if email is suppressed
create or replace function public.is_email_suppressed(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.email_suppressions
    where lower(email) = lower(p_email)
  );
$$;

grant execute on function public.is_email_suppressed(text) to authenticated, anon, service_role;

-- WORKFLOWS
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null,
  trigger_config jsonb default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  last_run_at timestamptz,
  run_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflows_user_idx on public.workflows (user_id);
create index if not exists workflows_trigger_idx on public.workflows (trigger_type) where is_active = true;

alter table public.workflows enable row level security;

create policy "user manages own workflows"
  on public.workflows
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- WORKFLOW EXECUTIONS
create table if not exists public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  trigger_payload jsonb,
  status text not null default 'pending',
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists workflow_executions_workflow_idx
  on public.workflow_executions (workflow_id, started_at desc);

alter table public.workflow_executions enable row level security;

create policy "user reads own executions"
  on public.workflow_executions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.workflows w
      where w.id = workflow_executions.workflow_id
      and w.user_id = auth.uid()
    )
  );

-- RPC: dispatch workflows for a trigger
-- Called by DB triggers (invoice.paid, event.created etc.) or Edge Functions
create or replace function public.dispatch_workflow_trigger(
  p_user_id uuid,
  p_trigger_type text,
  p_payload jsonb default '{}'::jsonb
)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workflow record;
  v_execution_id uuid;
begin
  for v_workflow in
    select * from public.workflows
    where user_id = p_user_id
      and trigger_type = p_trigger_type
      and is_active = true
  loop
    insert into public.workflow_executions (workflow_id, trigger_payload, status)
    values (v_workflow.id, p_payload, 'pending')
    returning id into v_execution_id;

    update public.workflows
      set last_run_at = now(), run_count = run_count + 1, updated_at = now()
      where id = v_workflow.id;

    -- Call the Edge Function asynchronously
    perform public.invoke_edge_function(
      'run-workflow',
      jsonb_build_object(
        'execution_id', v_execution_id,
        'workflow_id', v_workflow.id,
        'actions', v_workflow.actions,
        'payload', p_payload
      )
    );

    return next v_execution_id;
  end loop;
end;
$$;

grant execute on function public.dispatch_workflow_trigger(uuid, text, jsonb)
  to authenticated, service_role;

-- Trigger wiring: invoice.paid
create or replace function public.trg_workflow_invoice_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'paid' and (old.status is null or old.status != 'paid') then
    perform public.dispatch_workflow_trigger(
      new.user_id,
      'invoice_paid',
      jsonb_build_object(
        'invoice_id', new.id,
        'amount', new.amount,
        'client_id', new.client_id,
        'project_id', new.project_id
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists workflow_on_invoice_paid on public.invoices;
create trigger workflow_on_invoice_paid
  after insert or update of status on public.invoices
  for each row
  execute function public.trg_workflow_invoice_paid();

-- Trigger wiring: event.created
create or replace function public.trg_workflow_event_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.dispatch_workflow_trigger(
    new.user_id,
    'event_created',
    jsonb_build_object(
      'event_id', new.id,
      'title', new.title,
      'event_date', new.event_date,
      'client_id', new.client_id
    )
  );
  return new;
end;
$$;

drop trigger if exists workflow_on_event_created on public.events;
create trigger workflow_on_event_created
  after insert on public.events
  for each row
  execute function public.trg_workflow_event_created();

-- Trigger wiring: client.created
create or replace function public.trg_workflow_client_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.dispatch_workflow_trigger(
    new.user_id,
    'client_created',
    jsonb_build_object(
      'client_id', new.id,
      'full_name', new.full_name,
      'email', new.email,
      'phone', new.phone
    )
  );
  return new;
end;
$$;

drop trigger if exists workflow_on_client_created on public.wedding_clients;
create trigger workflow_on_client_created
  after insert on public.wedding_clients
  for each row
  execute function public.trg_workflow_client_created();
