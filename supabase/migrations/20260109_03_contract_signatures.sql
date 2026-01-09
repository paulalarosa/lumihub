-- Create signatures table to track contract signatures
create table if not exists public.contract_signatures (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  signed_by text not null,
  signed_at timestamp with time zone default now(),
  ip_address inet,
  signature_url text,
  created_at timestamp with time zone default now()
);

-- RLS Policies
alter table contract_signatures enable row level security;

-- Authenticated users can view signatures for projects they own
create policy "Users can view project signatures" on contract_signatures
  for select using (
    auth.uid() in (
      select user_id from projects where id = project_id
    )
  );

-- Service role can create signatures
create policy "Service role can create signatures" on contract_signatures
  for insert with check (true);

-- Indexed queries
create index if not exists contract_signatures_project_id_idx on contract_signatures(project_id);
create index if not exists contract_signatures_created_at_idx on contract_signatures(created_at desc);
