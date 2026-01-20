-- Migration: 20260120_robustness.sql
-- Description: Create system_logs and geo_cache tables

-- 1. System Logs Table
create table if not exists public.system_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  level text not null check (level in ('info', 'warn', 'error')),
  message text not null,
  metadata jsonb default '{}'::jsonb,
  source text default 'system',
  
  -- Add index for querying logs
  constraint system_logs_level_check check (level in ('info', 'warn', 'error'))
);

-- Enable RLS for system_logs (Admins only)
alter table public.system_logs enable row level security;

create policy "Admins can view system logs"
  on public.system_logs
  for select
  using (
    auth.jwt() ->> 'role' = 'service_role' OR
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Service role can insert system logs"
  on public.system_logs
  for insert
  with check (
    -- Only allow service role (Edge Functions) to insert, or maybe authenticated users for client logging if needed later.
    -- For now stick to back-end logging essentially.
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 2. Geo Cache Table (for Google Maps proxy)
create table if not exists public.geo_cache (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  query text not null unique, -- The address query or lat/lng
  response jsonb not null, -- The Google Maps API response
  expires_at timestamptz not null -- Cache expiry
);

-- Enable RLS for geo_cache
alter table public.geo_cache enable row level security;

create policy "Anyone can read valid geo_cache"
  on public.geo_cache
  for select
  using (expires_at > now());

create policy "Service role can manage geo_cache"
  on public.geo_cache
  for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Indexes for performance
create index if not exists idx_system_logs_created_at on public.system_logs(created_at desc);
create index if not exists idx_geo_cache_query on public.geo_cache(query);
