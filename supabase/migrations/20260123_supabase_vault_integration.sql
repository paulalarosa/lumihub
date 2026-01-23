
-- Migration: Integrate Supabase Vault for Encryption Key Management
-- Date: 2026-01-23

-- 1. Enable Supabase Vault
create extension if not exists supabase_vault with schema vault;

-- 2. Store Key in Vault (Idempotent)
-- NOTE: In production, you might rotate this key. usage of hardcoded key here is to migrate existing state.
-- We use DO block to insert only if not exists.
do $$
begin
    if not exists (select 1 from vault.secrets where name = 'google_integration_key') then
        -- Inserting the EXISTING key so we don't break current encrypted data.
        -- In a real rotation scenario, we would decrypt with old key and re-encrypt with new.
        insert into vault.secrets (name, secret)
        values ('google_integration_key', 'LUMI_SECURE_TOKEN_KEY');
    end if;
end $$;

-- 3. Update Functions to use Vault

-- Save Google Integration (Updated)
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
    v_encryption_key text;
begin
    -- Verify user is editing their own data or is admin/service
    if auth.uid() <> p_user_id and current_setting('request.jwt.claims.role', true) <> 'service_role' then
        raise exception 'Unauthorized';
    end if;

    -- Get Key from Vault
    select decrypted_secret into v_encryption_key 
    from vault.decrypted_secrets 
    where name = 'google_integration_key' 
    limit 1;

    if v_encryption_key is null then
        raise exception 'Encryption key not found in Vault';
    end if;

    v_expires_at := now() + (p_expires_in || ' seconds')::interval;

    insert into public.user_integrations (
        user_id, provider, access_token_encrypted, refresh_token_encrypted, token_expires_at, calendar_id, is_active, sync_enabled
    )
    values (
        p_user_id,
        'google',
        pgp_sym_encrypt(p_access_token, v_encryption_key),
        pgp_sym_encrypt(p_refresh_token, v_encryption_key),
        v_expires_at,
        p_calendar_id,
        true,
        true
    )
    on conflict (user_id, provider)
    do update set
        access_token_encrypted = pgp_sym_encrypt(p_access_token, v_encryption_key),
        refresh_token_encrypted = pgp_sym_encrypt(p_refresh_token, v_encryption_key),
        token_expires_at = v_expires_at,
        calendar_id = p_calendar_id,
        updated_at = now();
end;
$$;

-- Get Google Integration (Updated)
create or replace function public.get_google_integration(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
    v_record record;
    v_encryption_key text;
begin
    -- Verify auth
    if auth.uid() <> p_user_id and current_setting('request.jwt.claims.role', true) <> 'service_role' then
        raise exception 'Unauthorized';
    end if;

    -- Get Key from Vault
    select decrypted_secret into v_encryption_key 
    from vault.decrypted_secrets 
    where name = 'google_integration_key' 
    limit 1;

    if v_encryption_key is null then
        raise exception 'Encryption key not found in Vault';
    end if;

    select 
        id,
        pgp_sym_decrypt(access_token_encrypted::bytea, v_encryption_key) as access_token,
        pgp_sym_decrypt(refresh_token_encrypted::bytea, v_encryption_key) as refresh_token,
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

-- Update Google Token (Updated)
create or replace function public.update_google_token(
    p_integration_id uuid,
    p_access_token text,
    p_expires_in int
)
returns void
language plpgsql
security definer
as $$
declare
    v_encryption_key text;
begin
    -- Get Key from Vault (Internal function, but security good practice)
    select decrypted_secret into v_encryption_key 
    from vault.decrypted_secrets 
    where name = 'google_integration_key' 
    limit 1;

    if v_encryption_key is null then
        raise exception 'Encryption key not found in Vault';
    end if;

    update public.user_integrations
    set 
        access_token_encrypted = pgp_sym_encrypt(p_access_token, v_encryption_key),
        token_expires_at = now() + (p_expires_in || ' seconds')::interval,
        updated_at = now()
    where id = p_integration_id;
end;
$$;
