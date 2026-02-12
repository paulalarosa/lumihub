-- Migration Phase 14: Audit System Refactoring
-- Implementing a dedicated, trigger-based auditing system.

-- 1. Create the audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 3. Create the universal auditing function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Try to get the current user ID from the Supabase auth context
    v_user_id := (auth.uid());

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_data, new_data)
        VALUES (v_user_id, TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb, NULL);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_data, new_data)
        VALUES (v_user_id, TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_data, new_data)
        VALUES (v_user_id, TG_TABLE_NAME, NEW.id, 'INSERT', NULL, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply triggers to critical tables

-- Profiles
DROP TRIGGER IF EXISTS tr_audit_profiles ON public.profiles;
CREATE TRIGGER tr_audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Wedding Clients
DROP TRIGGER IF EXISTS tr_audit_wedding_clients ON public.wedding_clients;
CREATE TRIGGER tr_audit_wedding_clients
AFTER INSERT OR UPDATE OR DELETE ON public.wedding_clients
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Transactions
DROP TRIGGER IF EXISTS tr_audit_transactions ON public.transactions;
CREATE TRIGGER tr_audit_transactions
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Invoices
DROP TRIGGER IF EXISTS tr_audit_invoices ON public.invoices;
CREATE TRIGGER tr_audit_invoices
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Wallets
DROP TRIGGER IF EXISTS tr_audit_wallets ON public.wallets;
CREATE TRIGGER tr_audit_wallets
AFTER INSERT OR UPDATE OR DELETE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 5. Enable RLS on audit_logs (Viewable by Admins only or the specific user)
-- Note: Assuming there is an is_admin() function or similar based on previous context.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 6. Audit initial system log
INSERT INTO public.system_logs (level, severity, message, timestamp)
VALUES ('info', 'info', 'Phase 14: Audit system migration completed successfully.', timezone('utc'::text, now()));
