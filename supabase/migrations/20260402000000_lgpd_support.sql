
-- Migration: LGPD Support System
-- Description: Adds tables and RPCs for user data privacy management.

CREATE TABLE IF NOT EXISTS public.user_privacy_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT false,
    version TEXT DEFAULT '1.0',
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    UNIQUE (user_id, consent_type)
);

CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, cancelled
    request_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own consents"
    ON public.user_privacy_consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consents"
    ON public.user_privacy_consents FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own deletion requests"
    ON public.data_deletion_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests"
    ON public.data_deletion_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RPC: get_my_consents
DROP FUNCTION IF EXISTS public.get_my_consents();
CREATE OR REPLACE FUNCTION public.get_my_consents()
RETURNS TABLE (
    consent_type TEXT,
    granted BOOLEAN,
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    version TEXT
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT consent_type, granted, granted_at, revoked_at, version
    FROM public.user_privacy_consents
    WHERE user_id = auth.uid();
$$;

-- RPC: record_user_consent
DROP FUNCTION IF EXISTS public.record_user_consent(TEXT, BOOLEAN);
CREATE OR REPLACE FUNCTION public.record_user_consent(
    p_consent_type TEXT,
    p_granted BOOLEAN
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.user_privacy_consents (user_id, consent_type, granted, granted_at, revoked_at, version)
    VALUES (
        auth.uid(),
        p_consent_type,
        p_granted,
        CASE WHEN p_granted THEN now() ELSE NULL END,
        CASE WHEN NOT p_granted THEN now() ELSE NULL END,
        '1.0'
    )
    ON CONFLICT (user_id, consent_type) DO UPDATE
    SET granted = EXCLUDED.granted,
        granted_at = CASE WHEN EXCLUDED.granted THEN now() ELSE user_privacy_consents.granted_at END,
        revoked_at = CASE WHEN NOT EXCLUDED.granted THEN now() ELSE user_privacy_consents.revoked_at END,
        version = EXCLUDED.version;
END;
$$;

-- RPC: export_my_personal_data
DROP FUNCTION IF EXISTS public.export_my_personal_data();
CREATE OR REPLACE FUNCTION public.export_my_personal_data()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_data JSON;
BEGIN
    SELECT json_build_object(
        'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = auth.uid()),
        'makeup_artist_profile', (SELECT row_to_json(m) FROM public.makeup_artists m WHERE m.user_id = auth.uid()),
        'consents', (SELECT json_agg(c) FROM public.user_privacy_consents c WHERE c.user_id = auth.uid()),
        'projects', (SELECT json_agg(p) FROM public.projects p WHERE p.user_id = auth.uid()),
        'contracts', (SELECT json_agg(ct) FROM public.contracts ct WHERE ct.user_id = auth.uid()),
        'wedding_clients', (SELECT json_agg(w) FROM public.wedding_clients w WHERE w.user_id = auth.uid()),
        'exported_at', now()
    ) INTO v_data;
    RETURN v_data;
END;
$$;

-- RPC: request_data_deletion
DROP FUNCTION IF EXISTS public.request_data_deletion();
CREATE OR REPLACE FUNCTION public.request_data_deletion()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_request_id UUID;
BEGIN
    -- Check if a request already exists
    SELECT id INTO v_request_id
    FROM public.data_deletion_requests
    WHERE user_id = auth.uid() AND status = 'pending';

    IF v_request_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Você já possui uma solicitação de exclusão pendente.',
            'request_id', v_request_id
        );
    END IF;

    INSERT INTO public.data_deletion_requests (user_id)
    VALUES (auth.uid())
    RETURNING id INTO v_request_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Sua solicitação de exclusão foi registrada com sucesso e será processada pela nossa equipe.',
        'request_id', v_request_id
    );
END;
$$;
