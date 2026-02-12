-- Migration Phase 19: Audit Source Tracking
-- Adding a source column to distinguish between origin of changes.

-- 1. Add the column
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'DB_TRIGGER';

-- 2. Update the auditing function to handle source (if passed)
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_source TEXT;
BEGIN
    v_user_id := (auth.uid());
    
    -- In triggers, we don't easily get the source unless we use a session variable
    -- For now, default to DB_TRIGGER as specified in the column default.
    -- Future expansion: current_setting('kontrol.audit_source', true)
    
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

COMMENT ON COLUMN audit_logs.source IS 'The origin of the change (WEB_UI, DB_TRIGGER, API_SYNC)';
