-- ============================================================================
-- KHAOS KONTROL - Database Optimization Migration
-- Date: 2026-02-09
-- Purpose: Clean up legacy tables, consolidate RLS policies, add missing indexes
-- ============================================================================
-- ⚠️ BACKUP DATABASE BEFORE RUNNING THIS SCRIPT!
-- ============================================================================

-- ============================================================================
-- PHASE 1: DELETE LEGACY TABLES
-- ============================================================================

DROP TABLE IF EXISTS public.clients_backup_error CASCADE;
DROP TABLE IF EXISTS public.clients_bugada CASCADE;
DROP TABLE IF EXISTS public.clients_old_broken CASCADE;

-- ============================================================================
-- PHASE 2: CONSOLIDATE RLS POLICIES - EVENTS
-- Remove duplicate SELECT policies, keeping only necessary ones
-- ============================================================================

DROP POLICY IF EXISTS "Acesso público aos eventos via UUID" ON public.events;
DROP POLICY IF EXISTS "Acesso público eventos" ON public.events;
DROP POLICY IF EXISTS "Public Availability Check" ON public.events;
DROP POLICY IF EXISTS "Public Read Events" ON public.events;

-- ============================================================================
-- PHASE 3: CONSOLIDATE RLS POLICIES - CONTRACTS
-- ============================================================================

DROP POLICY IF EXISTS "Acesso público ao contrato via UUID" ON public.contracts;
DROP POLICY IF EXISTS "Acesso público contratos" ON public.contracts;
DROP POLICY IF EXISTS "Leitura pública contratos" ON public.contracts;
DROP POLICY IF EXISTS "Public Read Contracts" ON public.contracts;

-- ============================================================================
-- PHASE 4: CONSOLIDATE RLS POLICIES - SERVICES
-- ============================================================================

DROP POLICY IF EXISTS "Admin Select Services" ON public.services;
DROP POLICY IF EXISTS "Allow Admin Select" ON public.services;
DROP POLICY IF EXISTS "Portal_Read_Services_Base" ON public.services;

-- ============================================================================
-- PHASE 5: CONSOLIDATE RLS POLICIES - PROJECT_SERVICES
-- ============================================================================

DROP POLICY IF EXISTS "Admin Manage Project Services" ON public.project_services;
DROP POLICY IF EXISTS "Allow Admin Manage" ON public.project_services;
DROP POLICY IF EXISTS "Portal Read Project Services" ON public.project_services;

-- ============================================================================
-- PHASE 6: CONSOLIDATE RLS POLICIES - PROJECTS
-- ============================================================================

DROP POLICY IF EXISTS "Acesso público ao projeto via UUID" ON public.projects;
DROP POLICY IF EXISTS "Acesso público projetos" ON public.projects;
DROP POLICY IF EXISTS "Public Access" ON public.projects;

-- ============================================================================
-- PHASE 7: ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
    ON public.transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_events_user_id 
    ON public.events(user_id);

CREATE INDEX IF NOT EXISTS idx_events_event_date 
    ON public.events(event_date);

CREATE INDEX IF NOT EXISTS idx_contracts_user_id 
    ON public.contracts(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id 
    ON public.projects(user_id);

CREATE INDEX IF NOT EXISTS idx_wedding_clients_user_id 
    ON public.wedding_clients(user_id);

CREATE INDEX IF NOT EXISTS idx_wedding_clients_is_bride 
    ON public.wedding_clients(is_bride) 
    WHERE is_bride = true;

CREATE INDEX IF NOT EXISTS idx_profiles_parent_user_id 
    ON public.profiles(parent_user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id 
    ON public.tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_briefings_project_id 
    ON public.briefings(project_id);

-- ============================================================================
-- PHASE 8: ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

ANALYZE public.events;
ANALYZE public.projects;
ANALYZE public.contracts;
ANALYZE public.transactions;
ANALYZE public.wedding_clients;
ANALYZE public.profiles;

-- ============================================================================
-- VERIFICATION QUERIES (run separately to verify)
-- ============================================================================
-- SELECT count(*) as policy_count FROM pg_policies WHERE schemaname = 'public';
-- SELECT tablename, count(*) FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename ORDER BY count DESC;
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;
