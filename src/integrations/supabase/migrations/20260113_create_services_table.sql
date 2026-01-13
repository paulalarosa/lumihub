-- Create services table
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  price numeric not null default 0,
  duration_minutes integer not null default 60,
  description text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.services enable row level security;

-- Policies
create policy "Users can view their own services"
  on public.services for select
  using (auth.uid() = user_id);

create policy "Users can insert their own services"
  on public.services for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own services"
  on public.services for update
  using (auth.uid() = user_id);

create policy "Users can delete their own services"
  on public.services for delete
  using (auth.uid() = user_id);
