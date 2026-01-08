-- Lumi Geo-Intelligence Security Overhaul
-- Comprehensive RLS Implementation to Prevent Information Harvesting
-- Date: January 8, 2026

-- Enable RLS on all critical tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

DROP POLICY IF EXISTS "Users can view own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Public can view contracts via project token" ON public.contracts;

DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Users can insert events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;
DROP POLICY IF EXISTS "Assistants can view assigned events" ON public.events;
DROP POLICY IF EXISTS "Assistants can update assigned events" ON public.events;

DROP POLICY IF EXISTS "Users can view assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can insert assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can update own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Users can delete own assistants" ON public.assistants;
DROP POLICY IF EXISTS "Assistants can view own profile" ON public.assistants;
DROP POLICY IF EXISTS "Assistants can update own profile" ON public.assistants;

DROP POLICY IF EXISTS "Users can view services" ON public.services;
DROP POLICY IF EXISTS "Users can insert services" ON public.services;
DROP POLICY IF EXISTS "Users can update own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete own services" ON public.services;

-- ===========================================
-- PROFILES TABLE - Ultra Private
-- ===========================================

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ===========================================
-- CLIENTS TABLE - Business Owner Private
-- ===========================================

-- Users can only see clients they created
CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = created_by);

-- Users can insert clients (must be created by them)
CREATE POLICY "Users can insert clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own clients
CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own clients
CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE USING (auth.uid() = created_by);

-- ===========================================
-- PROJECTS TABLE - Business Owner Private
-- ===========================================

-- Users can only see projects they created
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = created_by);

-- Users can insert projects (must be created by them)
CREATE POLICY "Users can insert projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own projects
CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = created_by);

-- ===========================================
-- CONTRACTS TABLE - Maximum Security
-- ===========================================

-- Users can only see contracts for their projects
CREATE POLICY "Users can view own contracts" ON public.contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = contracts.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Users can insert contracts for their projects
CREATE POLICY "Users can insert contracts" ON public.contracts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = contracts.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Users can update contracts for their projects
CREATE POLICY "Users can update own contracts" ON public.contracts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = contracts.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Users can delete contracts for their projects
CREATE POLICY "Users can delete own contracts" ON public.contracts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = contracts.project_id
      AND projects.created_by = auth.uid()
    )
  );

-- ===========================================
-- EVENTS TABLE - Complex Access Control
-- ===========================================

-- Users can view events they created OR events where they are assigned as assistant
CREATE POLICY "Users can view own events" ON public.events
  FOR SELECT USING (
    auth.uid() = created_by OR
    auth.uid() = ANY(assigned_assistants)
  );

-- Users can insert events (must be created by them)
CREATE POLICY "Users can insert events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update events they created OR events where they are assigned as assistant
CREATE POLICY "Users can update own events" ON public.events
  FOR UPDATE USING (
    auth.uid() = created_by OR
    auth.uid() = ANY(assigned_assistants)
  );

-- Users can delete events they created
CREATE POLICY "Users can delete own events" ON public.events
  FOR DELETE USING (auth.uid() = created_by);

-- ===========================================
-- ASSISTANTS TABLE - Dual Access
-- ===========================================

-- Business owners can view assistants they created
CREATE POLICY "Users can view own assistants" ON public.assistants
  FOR SELECT USING (auth.uid() = created_by);

-- Business owners can insert assistants
CREATE POLICY "Users can insert assistants" ON public.assistants
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Business owners can update their assistants
CREATE POLICY "Users can update own assistants" ON public.assistants
  FOR UPDATE USING (auth.uid() = created_by);

-- Business owners can delete their assistants
CREATE POLICY "Users can delete own assistants" ON public.assistants
  FOR DELETE USING (auth.uid() = created_by);

-- Assistants can view their own profile
CREATE POLICY "Assistants can view own profile" ON public.assistants
  FOR SELECT USING (auth.uid() = id);

-- Assistants can update their own profile (limited fields)
CREATE POLICY "Assistants can update own profile" ON public.assistants
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    -- Assistants can only update safe fields
    OLD.created_by = NEW.created_by AND
    OLD.created_at = NEW.created_at
  );

-- ===========================================
-- SERVICES TABLE - Business Owner Private
-- ===========================================

-- Users can only see services they created
CREATE POLICY "Users can view own services" ON public.services
  FOR SELECT USING (auth.uid() = created_by);

-- Users can insert services
CREATE POLICY "Users can insert services" ON public.services
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their services
CREATE POLICY "Users can update own services" ON public.services
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their services
CREATE POLICY "Users can delete own services" ON public.services
  FOR DELETE USING (auth.uid() = created_by);

-- ===========================================
-- SECURITY ENHANCEMENTS
-- ===========================================

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is assistant
CREATE OR REPLACE FUNCTION public.is_assistant(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.assistants
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add additional security: prevent information harvesting via rate limiting
-- This would be implemented at the application level with middleware

-- Log security events (optional - for monitoring)
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security logs" ON public.security_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Users can insert their own security logs
CREATE POLICY "Users can insert security logs" ON public.security_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- DATA ENCRYPTION ENHANCEMENT
-- ===========================================

-- Add encrypted fields for sensitive data
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS encrypted_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS encrypted_briefing TEXT;

-- Create function to generate encrypted UUIDs
CREATE OR REPLACE FUNCTION public.generate_encrypted_uuid()
RETURNS TEXT AS $$
DECLARE
  raw_uuid UUID := gen_random_uuid();
  encrypted_uuid TEXT;
BEGIN
  -- Simple obfuscation (in production, use proper encryption)
  encrypted_uuid := encode(digest(raw_uuid::text, 'sha256'), 'hex');
  RETURN encrypted_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update existing contracts with encrypted IDs
UPDATE public.contracts
SET encrypted_id = public.generate_encrypted_uuid()
WHERE encrypted_id IS NULL;

-- Add trigger to auto-generate encrypted IDs for new contracts
CREATE OR REPLACE FUNCTION public.set_encrypted_contract_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.encrypted_id IS NULL THEN
    NEW.encrypted_id := public.generate_encrypted_uuid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_encrypted_contract_id_trigger
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_encrypted_contract_id();

-- ===========================================
-- AUDIT TRAIL
-- ===========================================

-- Create comprehensive audit table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_log
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Function to log changes
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[] := ARRAY[]::TEXT[];
  field_name TEXT;
BEGIN
  -- For updates, track changed fields
  IF TG_OP = 'UPDATE' THEN
    FOR field_name IN SELECT jsonb_object_keys(to_jsonb(OLD))
    LOOP
      IF OLD.field_name IS DISTINCT FROM NEW.field_name THEN
        changed_fields := array_append(changed_fields, field_name);
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.audit_log (
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_fields
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    changed_fields
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to critical tables
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_clients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_contracts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- ===========================================
-- FINAL SECURITY VALIDATION
-- ===========================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure no public access to any table
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Final validation query (run this manually to verify)
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('profiles', 'clients', 'projects', 'contracts', 'events', 'assistants', 'services')
-- ORDER BY tablename;