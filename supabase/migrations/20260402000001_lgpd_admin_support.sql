-- Admin LGPD Support Migration
-- Includes functions for listing requests and processing deletions (anonymization)

-- Drop existing functions to allow return type changes
DROP FUNCTION IF EXISTS public.get_lgpd_requests();
DROP FUNCTION IF EXISTS public.admin_process_deletion(UUID, TEXT);

-- Function to get all LGPD deletion requests with user details
CREATE OR REPLACE FUNCTION public.get_lgpd_requests()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    request_type TEXT,
    status TEXT,
    requested_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Security check: only admins can call this
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem visualizar solicitações LGPD.';
    END IF;

    RETURN QUERY
    SELECT 
        dr.id,
        dr.user_id,
        p.email as user_email,
        p.full_name as user_name,
        'DATA_DELETION' as request_type,
        dr.status,
        dr.created_at as requested_at,
        dr.updated_at as completed_at,
        dr.request_reason as notes
    FROM public.data_deletion_requests dr
    LEFT JOIN public.profiles p ON dr.user_id = p.id
    ORDER BY dr.created_at DESC;
END;
$$;

-- Function to process an LGPD deletion request (Approve/Reject)
CREATE OR REPLACE FUNCTION public.admin_process_deletion(
    p_request_id UUID,
    p_action TEXT -- 'approve' or 'reject'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    -- Security check: only admins can call this
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem processar solicitações LGPD.';
    END IF;

    -- Get the user_id for the request
    SELECT user_id INTO v_user_id
    FROM public.data_deletion_requests
    WHERE id = p_request_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Solicitação não encontrada ou já processada.');
    END IF;

    IF p_action = 'reject' THEN
        UPDATE public.data_deletion_requests
        SET status = 'rejected', updated_at = now()
        WHERE id = p_request_id;

        RETURN jsonb_build_object('success', true, 'message', 'Solicitação rejeitada com sucesso.');
    END IF;

    IF p_action = 'approve' THEN
        -- UPDATE STATUS TO PROCESSING
        UPDATE public.data_deletion_requests
        SET status = 'processing', updated_at = now()
        WHERE id = p_request_id;

        -- 1. Anonymize Profile
        UPDATE public.profiles
        SET 
            full_name = 'USUÁRIO_EXCLUÍDO_' || floor(random() * 1000000)::text,
            first_name = 'EXCLUÍDO',
            last_name = 'LGPD',
            email = 'deleted_' || floor(random() * 1000000)::text || '@deleted.invalid',
            phone = NULL,
            address = NULL,
            city = NULL,
            document_id = NULL,
            birth_date = NULL,
            bio = '[DADOS REMOVIDOS POR SOLICITAÇÃO LGPD]',
            avatar_url = NULL,
            business_name = 'EMPRESA_EXCLUÍDA',
            primary_color = '#666666',
            instagram = NULL,
            website = NULL
        WHERE id = v_user_id;

        -- 2. Anonymize Public Profile
        UPDATE public.public_profiles
        SET
            full_name = 'PROFISSIONAL_EXCLUÍDO',
            bio = '[DADOS REMOVIDOS]',
            avatar_url = NULL,
            instagram_url = NULL,
            website_url = NULL
        WHERE id = v_user_id;

        -- 3. Delete Sensitive Linked Data (Clients, Contracts, Projects)
        -- We might want to keep the records but anonymize them to preserve financial statistics,
        -- but usually a full deletion requested by user is preferred for these.
        DELETE FROM public.wedding_clients WHERE professional_id = v_user_id;
        DELETE FROM public.projects WHERE professional_id = v_user_id;
        DELETE FROM public.contracts WHERE user_id = v_user_id;
        
        -- UPDATE STATUS TO COMPLETED
        UPDATE public.data_deletion_requests
        SET status = 'completed', updated_at = now()
        WHERE id = p_request_id;

        RETURN jsonb_build_object('success', true, 'message', 'Dados do usuário anonimizados e registros associados excluídos com sucesso.');
    END IF;

    RETURN jsonb_build_object('success', false, 'message', 'Ação inválida.');
END;
$$;
