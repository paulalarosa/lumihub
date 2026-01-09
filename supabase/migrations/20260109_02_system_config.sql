-- Migration: System configuration table for CMS-like functionality
-- Date: 2026-01-09

-- 1) System Config Table
create table if not exists public.system_config (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  type varchar(32) not null check (type in ('string', 'number', 'boolean', 'json')),
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create index if not exists system_config_key_idx on public.system_config (key);

-- RLS: only admins can update, authenticated users can read
alter table public.system_config enable row level security;

create policy system_config_select_authenticated on public.system_config for select using (
  auth.role() = 'authenticated'
);

create policy system_config_manage_admin on public.system_config for all using (
  current_setting('request.jwt.claims.role', true) = 'admin' OR
  current_setting('request.jwt.claims.role', true) = 'service_role'
) with check (
  current_setting('request.jwt.claims.role', true) = 'admin' OR
  current_setting('request.jwt.claims.role', true) = 'service_role'
);

-- 2) Insert default system config values
insert into public.system_config (key, value, type, description) values
  ('landing_page_title', 'Lumi—Excelência em Arte', 'string', 'Main title on landing page'),
  ('landing_page_subtitle', 'Uma plataforma minimalista e sofisticada para profissionais de beleza', 'string', 'Subtitle on landing page'),
  ('plan_price_monthly', '299', 'number', 'Monthly plan price in BRL'),
  ('plan_price_annual', '2990', 'number', 'Annual plan price in BRL'),
  ('free_trial_days', '14', 'number', 'Free trial duration in days'),
  ('platform_fee_percentage', '5', 'number', 'Platform fee as percentage of transaction'),
  ('settlement_days', '7', 'number', 'Days until pending balance settles'),
  ('support_email', 'suporte@lumi.com', 'string', 'Main support email'),
  ('max_file_upload_mb', '50', 'number', 'Max upload size in MB'),
  ('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode')
on conflict (key) do nothing;

-- 3) Trigger to update updated_at timestamp
create or replace function public.fn_system_config_updated() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_system_config_updated on public.system_config;
create trigger trg_system_config_updated
  before update on public.system_config
  for each row execute function public.fn_system_config_updated();

-- 4) Create view for easy access to config (cached)
create or replace view public.system_config_view as
select
  key,
  value,
  type,
  description,
  updated_at
from public.system_config;

grant select on public.system_config_view to authenticated;

-- End of migration
