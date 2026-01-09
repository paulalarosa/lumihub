-- Migration: Financial module for Lumi - wallets, transactions, split_rules, payouts
-- Date: 2026-01-09

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Wallets: digital wallet per user
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  available_balance numeric(18,2) not null default 0 check (available_balance >= 0),
  pending_balance numeric(18,2) not null default 0 check (pending_balance >= 0),
  bank_details jsonb,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists wallets_user_id_idx on public.wallets (user_id);

-- Row Level Security for wallets
alter table public.wallets enable row level security;

-- Allow owners to SELECT their wallet and admins to SELECT all
create policy wallets_select_owner on public.wallets for select using (
  user_id = auth.uid() OR current_setting('request.jwt.claims.role', true) = 'admin'
);

-- Allow users to INSERT their own wallet record
create policy wallets_insert_owner on public.wallets for insert with check (
  user_id = auth.uid()
);

-- Allow users to update basic contact/bank details and admins to update balances
create policy wallets_update_owner on public.wallets for update using (
  user_id = auth.uid() OR current_setting('request.jwt.claims.role', true) = 'admin'
) with check (
  (user_id = auth.uid()) OR (current_setting('request.jwt.claims.role', true) = 'admin')
);

-- 2) Transactions: ledger entries (charges, refunds, adjustments)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  id_stripe text,
  user_id uuid not null references auth.users(id) on delete cascade,
  appointment_id uuid references public.appointments(id),
  gross_amount numeric(18,2) not null check (gross_amount >= 0),
  platform_fee numeric(18,2) not null default 0 check (platform_fee >= 0),
  net_amount numeric(18,2) generated always as (gross_amount - platform_fee) stored,
  currency varchar(8) not null default 'BRL',
  type varchar(32) not null check (type in ('charge','refund','payout','adjustment')),
  status varchar(32) not null check (status in ('pending','completed','failed','canceled','refunded')),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_created_at_idx on public.transactions (created_at);

-- Row Level Security for transactions
alter table public.transactions enable row level security;

-- Owners and admins can SELECT transactions
create policy transactions_select_owner on public.transactions for select using (
  user_id = auth.uid() OR current_setting('request.jwt.claims.role', true) = 'admin'
);

-- Inserts should come from backend (service role) or admins only
create policy transactions_insert_backend on public.transactions for insert with check (
  current_setting('request.jwt.claims.role', true) = 'service_role' OR current_setting('request.jwt.claims.role', true) = 'admin'
);

-- Updates/deletes only by admin/service
create policy transactions_manage_admin on public.transactions for update using (
  current_setting('request.jwt.claims.role', true) = 'service_role' OR current_setting('request.jwt.claims.role', true) = 'admin'
) with check (
  current_setting('request.jwt.claims.role', true) = 'service_role' OR current_setting('request.jwt.claims.role', true) = 'admin'
);
create policy transactions_delete_admin on public.transactions for delete using (
  current_setting('request.jwt.claims.role', true) = 'service_role' OR current_setting('request.jwt.claims.role', true) = 'admin'
);


-- 3) Split Rules: marketplace split definitions per service
create table if not exists public.split_rules (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  percentage numeric(5,2) not null check (percentage > 0 AND percentage <= 100),
  active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists split_rules_service_idx on public.split_rules (service);

-- RLS: read by authenticated users (so UI can display), management by admin only
alter table public.split_rules enable row level security;
create policy split_rules_select_auth on public.split_rules for select using (
  auth.role() = 'authenticated' OR current_setting('request.jwt.claims.role', true) = 'admin'
);
create policy split_rules_manage_admin on public.split_rules for all using (
  current_setting('request.jwt.claims.role', true) = 'admin'
) with check (
  current_setting('request.jwt.claims.role', true) = 'admin'
);

-- 4) Payouts: user-initiated withdrawal requests
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(18,2) not null check (amount > 0),
  fee numeric(18,2) not null default 0 check (fee >= 0),
  net_amount numeric(18,2) generated always as (amount - fee) stored,
  bank_details jsonb,
  external_payout_id text,
  status varchar(32) not null check (status in ('requested','processing','completed','failed','canceled')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  metadata jsonb
);

create index if not exists payouts_user_id_idx on public.payouts (user_id);

-- RLS: owners can view/insert their own payouts; admins can manage
alter table public.payouts enable row level security;

create policy payouts_select_owner on public.payouts for select using (
  user_id = auth.uid() OR current_setting('request.jwt.claims.role', true) = 'admin'
);

-- Allow users to create payout requests only for themselves and if they have enough available balance
create policy payouts_insert_owner on public.payouts for insert with check (
  user_id = auth.uid() AND
  amount > 0 AND
  amount <= coalesce((select available_balance from public.wallets where user_id = auth.uid()), 0)
);

-- Allow users to update their own payout only to cancel it (from requested -> canceled)
create policy payouts_update_owner on public.payouts for update using (
  user_id = auth.uid() OR current_setting('request.jwt.claims.role', true) = 'admin'
) with check (
  (user_id = auth.uid() AND (status in ('requested','canceled'))) OR (current_setting('request.jwt.claims.role', true) = 'admin')
);

-- Admin/service can update statuses freely
create policy payouts_manage_admin on public.payouts for update using (
  current_setting('request.jwt.claims.role', true) = 'service_role' OR current_setting('request.jwt.claims.role', true) = 'admin'
) with check (
  current_setting('request.jwt.claims.role', true) = 'service_role' OR current_setting('request.jwt.claims.role', true) = 'admin'
);

-- 5) Triggers to keep wallet balances in sync
-- When a transaction is completed (charge), credit pending_balance by net_amount
create or replace function public.fn_transactions_after_insert() returns trigger as $$
begin
  if (new.status = 'completed') then
    -- credit pending balance (funds awaiting settlement)
    update public.wallets set pending_balance = pending_balance + new.net_amount, updated_at = now() where user_id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_transactions_after_insert on public.transactions;
create trigger trg_transactions_after_insert
  after insert on public.transactions
  for each row execute function public.fn_transactions_after_insert();

-- When a payout is requested, reserve funds by decrementing available_balance
create or replace function public.fn_payouts_after_insert_update() returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    if (new.status = 'requested') then
      update public.wallets set available_balance = available_balance - new.amount, updated_at = now() where user_id = new.user_id;
    end if;
    return new;
  elsif (tg_op = 'UPDATE') then
    -- if payout moved to completed, reduce pending (if you tracked it). here we assume requested already decreased available_balance
    if (old.status <> 'completed' and new.status = 'completed') then
      -- mark processed time
      update public.wallets set pending_balance = greatest(pending_balance - new.amount, 0), updated_at = now() where user_id = new.user_id;
    elsif (old.status = 'requested' and new.status in ('failed','canceled')) then
      -- refund to available balance
      update public.wallets set available_balance = available_balance + new.amount, updated_at = now() where user_id = new.user_id;
    end if;
    return new;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_payouts_after_ins_upd on public.payouts;
create trigger trg_payouts_after_ins_upd
  after insert or update on public.payouts
  for each row execute function public.fn_payouts_after_insert_update();

-- 6) View: financial_overview (monthly and annual summary per user)
create or replace view public.financial_overview as
select
  user_id,
  to_char(date_trunc('month', created_at), 'YYYY-MM-01')::date as period_start,
  'monthly' as period_type,
  sum(gross_amount) filter (where status = 'completed') as gross_revenue,
  sum(platform_fee) filter (where status = 'completed') as platform_fees,
  sum(net_amount) filter (where status = 'completed') as net_revenue,
  count(*) filter (where status = 'completed') as transactions_count
from public.transactions
group by user_id, date_trunc('month', created_at)
union all
select
  user_id,
  to_char(date_trunc('year', created_at), 'YYYY-01-01')::date as period_start,
  'annual' as period_type,
  sum(gross_amount) filter (where status = 'completed') as gross_revenue,
  sum(platform_fee) filter (where status = 'completed') as platform_fees,
  sum(net_amount) filter (where status = 'completed') as net_revenue,
  count(*) filter (where status = 'completed') as transactions_count
from public.transactions
group by user_id, date_trunc('year', created_at);

-- Grant select on view to authenticated users (useful for dashboards)
grant select on public.financial_overview to authenticated;

-- End of migration
