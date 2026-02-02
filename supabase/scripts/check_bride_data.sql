-- ==============================================================================
-- DEBUG SCRIPT: Verify Bride Portal Data
-- Description: Run this script with a Client UUID to see if data exists/links up.
-- ==============================================================================

-- 1. Replace 'YOUR_CLIENT_UUID_HERE' with the ID from the URL.
DO $$
DECLARE
    v_target_id UUID := 'YOUR_CLIENT_UUID_HERE'; -- <--- PASTE ID HERE
    v_client_name TEXT;
    v_event_count INT;
    v_project_count INT;
    v_contract_count INT;
BEGIN
    RAISE NOTICE '--- START DEBUG ---';
    
    -- Check Client
    SELECT name INTO v_client_name FROM public.clients WHERE id = v_target_id;
    IF v_client_name IS NULL THEN
        RAISE NOTICE '❌ Client NOT FOUND with ID: %', v_target_id;
    ELSE
        RAISE NOTICE '✅ Client Found: %', v_client_name;
    END IF;

    -- Check Projects (Linked by client_id)
    SELECT count(*) INTO v_project_count FROM public.projects WHERE client_id = v_target_id;
    RAISE NOTICE '👉 Projects Found: %', v_project_count;

    -- Check Events (Linked by client_id)
    SELECT count(*) INTO v_event_count FROM public.events WHERE client_id = v_target_id;
    RAISE NOTICE '👉 Events Found: %', v_event_count;

    -- Check Contracts (Linked via table contracts -> projects -> client)
    SELECT count(*) INTO v_contract_count 
    FROM public.contracts c
    JOIN public.projects p ON p.id = c.project_id
    WHERE p.client_id = v_target_id;
    
    RAISE NOTICE '👉 Contracts Found (via standard join): %', v_contract_count;

    RAISE NOTICE '--- END DEBUG ---';
END $$;
