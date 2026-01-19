-- Create a secure function to validate bride PIN without exposing the table to anon
CREATE OR REPLACE FUNCTION public.validate_bride_pin(client_id UUID, pin_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    client_record RECORD;
BEGIN
    -- Disable RLS for this function execution
    
    SELECT id, name
    INTO client_record
    FROM wedding_clients
    WHERE id = client_id AND secret_code = pin_code;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'valid', true,
            'client_id', client_record.id,
            'name', client_record.name
        );
    ELSE
        RETURN jsonb_build_object(
            'valid', false
        );
    END IF;
END;
$$;

-- Grant execute permission to anon/authenticated
GRANT EXECUTE ON FUNCTION public.validate_bride_pin(UUID, TEXT) TO anon, authenticated, service_role;
