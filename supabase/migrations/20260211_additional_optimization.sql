-- ============================================================================
-- KHAOS KONTROL - Additional Database Optimization
-- Date: 2026-02-11
-- Purpose: Add missing indexes for Assistant Portal tables
-- ============================================================================

-- ============================================================================
-- ASSISTANTS & INVITES INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assistants_user_id 
    ON public.assistants(user_id);

CREATE INDEX IF NOT EXISTS idx_assistant_invites_invite_token 
    ON public.assistant_invites(invite_token);

CREATE INDEX IF NOT EXISTS idx_assistant_invites_email 
    ON public.assistant_invites(assistant_email);

CREATE INDEX IF NOT EXISTS idx_assistant_invites_makeup_artist_id 
    ON public.assistant_invites(makeup_artist_id);

-- ============================================================================
-- ASSISTANT ACCESS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assistant_access_assistant_id 
    ON public.assistant_access(assistant_id);

CREATE INDEX IF NOT EXISTS idx_assistant_access_makeup_artist_id 
    ON public.assistant_access(makeup_artist_id);

-- ============================================================================
-- APPOINTMENT & EVENT RELATIONSHIPS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_appointments_assistant_id 
    ON public.appointments(assistant_id);

CREATE INDEX IF NOT EXISTS idx_appointments_client_id 
    ON public.appointments(client_id);

CREATE INDEX IF NOT EXISTS idx_event_assistants_assistant_id 
    ON public.event_assistants(assistant_id);

CREATE INDEX IF NOT EXISTS idx_event_assistants_event_id 
    ON public.event_assistants(event_id);

-- ============================================================================
-- ANALYZE NEW TABLES
-- ============================================================================

ANALYZE public.assistants;
ANALYZE public.assistant_invites;
ANALYZE public.assistant_access;
ANALYZE public.appointments;
