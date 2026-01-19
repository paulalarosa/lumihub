-- Migration: Security Hardening (RLS & Encryption)
-- Date: 2026-01-19

-- 1. Enable pgcrypto for encryption if not already enabled
create extension if not exists pgcrypto;

-- 2. Security Hardening for wedding_clients
alter table public.wedding_clients enable row level security;

-- Drop existing policies to ensure clean state (if any exist that are too permissive)
drop policy if exists "Users can only see their own clients" on public.wedding_clients;
drop policy if exists "Users can select their own clients" on public.wedding_clients;
drop policy if exists "Start can view all" on public.wedding_clients;

-- Enforce strict ownership
create policy "Users can only see their own clients"
on public.wedding_clients
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 3. Security Hardening for assistants
alter table public.assistants enable row level security;

-- Drop existing policies
drop policy if exists "Users can view their own assistants" on public.assistants;
drop policy if exists "Users can create their own assistants" on public.assistants;
drop policy if exists "Users can update their own assistants" on public.assistants;
drop policy if exists "Users can delete their own assistants" on public.assistants;
drop policy if exists "Assistants can view their own record" on public.assistants;

-- Users (Owners) Policies
create policy "Users can view their own assistants"
on public.assistants for select
using (auth.uid() = user_id);

create policy "Users can create their own assistants"
on public.assistants for insert
with check (auth.uid() = user_id);

create policy "Users can update their own assistants"
on public.assistants for update
using (auth.uid() = user_id);

create policy "Users can delete their own assistants"
on public.assistants for delete
using (auth.uid() = user_id);

-- Assistants Self-View Policy
create policy "Assistants can view their own record"
on public.assistants for select
using (assistant_user_id = auth.uid());

-- 4. Encryption for user_integrations (Google Calendar Tokens)

-- Enable pgcrypto (already enabled on top)

-- Rename columns to indicate they will hold encrypted data (and change type to text or bytea)
-- We'll use TEXT and store armored PGP messages (ASCII) to avoid bytea complexity in JSON responses if generic clients use it.
-- But bytea is better for storage. Let's stick to text (Base64 or Armored) for simpler migration if possible, 
-- or simply keep column names and change content.
-- Let's rename to _encrypted to be explicit.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_integrations' AND column_name = 'access_token') THEN
        ALTER TABLE public.user_integrations RENAME COLUMN access_token TO access_token_encrypted;
        ALTER TABLE public.user_integrations RENAME COLUMN refresh_token TO refresh_token_encrypted;
    END IF;
END $$;

-- Update RLS to ensure we can still manage rows
alter table public.user_integrations enable row level security;

drop policy if exists "Users can manage their own integrations" on public.user_integrations;

create policy "Users can manage their own integrations"
on public.user_integrations
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Create RPC to UPSERT integration (Encrypting)
create or replace function public.save_google_integration(
    p_user_id uuid,
    p_access_token text,
    p_refresh_token text,
    p_calendar_id text,
    p_expires_in int
)
returns void
language plpgsql
security definer
as $$
declare
    v_expires_at timestamptz;
begin
    -- Verify user is editing their own data or is admin/service
    if auth.uid() <> p_user_id and current_setting('request.jwt.claims.role', true) <> 'service_role' then
        raise exception 'Unauthorized';
    end if;

    v_expires_at := now() + (p_expires_in || ' seconds')::interval;

    insert into public.user_integrations (
        user_id, provider, access_token_encrypted, refresh_token_encrypted, token_expires_at, calendar_id, is_active, sync_enabled
    )
    values (
        p_user_id,
        'google',
        pgp_sym_encrypt(p_access_token, 'LUMI_SECURE_TOKEN_KEY'),
        pgp_sym_encrypt(p_refresh_token, 'LUMI_SECURE_TOKEN_KEY'),
        v_expires_at,
        p_calendar_id,
        true,
        true
    )
    on conflict (user_id, provider)
    do update set
        access_token_encrypted = pgp_sym_encrypt(p_access_token, 'LUMI_SECURE_TOKEN_KEY'),
        refresh_token_encrypted = pgp_sym_encrypt(p_refresh_token, 'LUMI_SECURE_TOKEN_KEY'),
        token_expires_at = v_expires_at,
        calendar_id = p_calendar_id,
        updated_at = now();
end;
$$;

-- Create RPC to GET integration (Decrypting)
create or replace function public.get_google_integration(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
    v_record record;
begin
    -- Verify auth
    if auth.uid() <> p_user_id and current_setting('request.jwt.claims.role', true) <> 'service_role' then
        raise exception 'Unauthorized';
    end if;

    select 
        id,
        pgp_sym_decrypt(access_token_encrypted::bytea, 'LUMI_SECURE_TOKEN_KEY') as access_token,
        pgp_sym_decrypt(refresh_token_encrypted::bytea, 'LUMI_SECURE_TOKEN_KEY') as refresh_token,
        token_expires_at,
        calendar_id
    into v_record
    from public.user_integrations
    where user_id = p_user_id and provider = 'google' and is_active = true;

    if v_record.id is null then
        return null;
    end if;

    return row_to_json(v_record);
end;
$$;

-- Update Token RPC (for refresh)
create or replace function public.update_google_token(
    p_integration_id uuid,
    p_access_token text,
    p_expires_in int
)
returns void
language plpgsql
security definer
as $$
begin
    update public.user_integrations
    set 
        access_token_encrypted = pgp_sym_encrypt(p_access_token, 'LUMI_SECURE_TOKEN_KEY'),
        token_expires_at = now() + (p_expires_in || ' seconds')::interval,
        updated_at = now()
    where id = p_integration_id;
end;
$$;
