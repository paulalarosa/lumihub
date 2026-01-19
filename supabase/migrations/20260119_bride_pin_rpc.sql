-- Migration: Secure Bride PIN validation
-- Date: 2026-01-19

-- Secure RPC to validate PIN and get client ID
-- Returns client_id if PIN matches, otherwise null or error.
-- SECURITY DEFINER allows bypassing RLS on wedding_clients (since user is not logged in or is anon).
create or replace function public.validate_bride_pin(p_client_id uuid, p_pin text)
returns json
language plpgsql
security definer
as $$
declare
    v_client record;
begin
    select id, name, secret_code
    into v_client
    from public.wedding_clients
    where id = p_client_id;

    if v_client.id is null then
        return json_build_object('success', false, 'message', 'Client not found');
    end if;

    if v_client.secret_code = p_pin then
        return json_build_object('success', true, 'client_id', v_client.id, 'name', v_client.name);
    else
        return json_build_object('success', false, 'message', 'Invalid PIN');
    end if;
end;
$$;

-- Secure RPC to get Bride Dashboard Data
-- Allows fetching client details + events if PIN is provided (or just client_id if we assume session check is done in app)
-- However, safe approach: We require PIN every time OR we assume the app handles a session token?
-- The Bride Portal uses `localStorage` "bride_auth_${clientId}" = true. This is client-side only.
-- Realistically, to be secure, 'anon' should NOT be able to read events unless we have a policy.
-- The policy "Users can only see their own clients" blocks 'anon'.
-- So we need an RPC to fetch events for the portal.

create or replace function public.get_bride_dashboard_data(p_client_id uuid, p_pin text)
returns json
language plpgsql
security definer
as $$
declare
    v_client_data json;
    v_events_data json;
    v_valid boolean;
begin
    -- 1. Validate PIN internally again (Stateless security)
    select (secret_code = p_pin) into v_valid
    from public.wedding_clients
    where id = p_client_id;

    if v_valid is not true then
        raise exception 'Invalid Credentials';
    end if;

    -- 2. Fetch Client Info
    select json_build_object(
        'id', id,
        'name', name,
        'wedding_date', wedding_date
    ) into v_client_data
    from public.wedding_clients
    where id = p_client_id;

    -- 3. Fetch Events
    select json_agg(
        json_build_object(
            'id', id,
            'title', title,
            'event_date', event_date,
            'event_type', event_type,
            'total_value', total_value,
            'project_id', project_id
        ) order by event_date asc
    ) into v_events_data
    from public.events
    where client_id = p_client_id;

    -- 4. Return Combined
    return json_build_object(
        'bride', v_client_data,
        'events', coalesce(v_events_data, '[]'::json)
    );
end;
$$;
