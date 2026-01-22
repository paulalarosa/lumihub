-- Migration: Update Bride Dashboard RPC to include Contracts
-- Date: 2026-01-22
-- Description: Adds 'contracts' and 'projects' to the dashboard response.

create or replace function public.get_bride_dashboard_data(p_client_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_client_id uuid;
    v_result jsonb;
    v_is_valid boolean;
begin
    -- 1. Validate PIN
    select public.validate_bride_pin(p_client_id, p_pin) into v_is_valid;
    
    if not v_is_valid then
        raise exception 'Invalid Credentials';
    end if;

    -- 2. Fetch Data
    select jsonb_build_object(
        'bride', (
            select jsonb_build_object(
                'id', c.id,
                'name', c.name,
                'wedding_date', c.wedding_date,
                'email', c.email,
                'phone', c.phone
            )
            from public.clients c
            where c.id = p_client_id
        ),
        'events', (
            select jsonb_agg(
                jsonb_build_object(
                    'id', e.id,
                    'title', e.title,
                    'event_date', e.event_date,
                    'event_type', e.title -- Fallback if event_type column doesn't exist
                ) order by e.event_date asc
            )
            from public.events e
            where e.client_id = p_client_id
        ),
        'contracts', (
            -- Fetch Projects that act as Contracts, or joined with signatures
            select jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'project_id', p.id,
                    'title', p.name,
                    'status', p.status, -- 'active', 'completed', etc.
                    'total_value', p.estimated_value, -- or calculated total
                    'signed_at', (
                        select cs.signed_at 
                        from public.contract_signatures cs 
                        where cs.project_id = p.id 
                        limit 1
                    ),
                    'signature_data', (
                         select jsonb_build_object('pdf_url', cs.signature_url)
                         from public.contract_signatures cs
                         where cs.project_id = p.id
                         limit 1
                    )
                )
            )
            from public.projects p
            where p.client_id = p_client_id
        )
    ) into v_result;

    return v_result;
end;
$$;
