-- Migration Phase 20: Audit Governance & Compliance
-- Implementing retention policies and session-based source tracking.

-- 1. Create Archive Table
CREATE TABLE IF NOT EXISTS public.audit_logs_archive (
    LIKE public.audit_logs INCLUDING ALL
);

-- 2. Function to Archive Old Logs (90 days retention)
CREATE OR REPLACE FUNCTION public.archive_old_audit_logs(retention_days INT DEFAULT 90)
RETURNS void AS $$
BEGIN
    -- Move old logs to archive
    WITH moved_rows AS (
        DELETE FROM public.audit_logs
        WHERE created_at < NOW() - (retention_days || ' days')::interval
        RETURNING *
    )
    INSERT INTO public.audit_logs_archive
    SELECT * FROM moved_rows;
    
    PERFORM public.send_templated_email(
        (SELECT email FROM profiles WHERE id IN (SELECT user_id FROM team_members WHERE role = 'admin') LIMIT 1),
        'Khaos_System_Alert',
        jsonb_build_object(
            'subject', 'KONTROL: Audit Archive Processed',
            'message', 'Audit logs older than ' || retention_days || ' days have been moved to archive.'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update process_audit_log to support session-based source
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_source TEXT;
BEGIN
    v_user_id := (auth.uid());
    
    -- Attempt to get source from session variable, fallback to 'DB_TRIGGER'
    BEGIN
        v_source := current_setting('kontrol.audit_source', true);
    EXCEPTION WHEN OTHERS THEN
        v_source := NULL;
    END;
    
    IF v_source IS NULL THEN
        v_source := 'DB_TRIGGER';
    END IF;
    
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_data, new_data, source)
        VALUES (v_user_id, TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb, NULL, v_source);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_data, new_data, source)
        VALUES (v_user_id, TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, v_source);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_data, new_data, source)
        VALUES (v_user_id, TG_TABLE_NAME, NEW.id, 'INSERT', NULL, row_to_json(NEW)::jsonb, v_source);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Helper to set session audit source
CREATE OR REPLACE FUNCTION public.set_audit_source(source_text TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format('SET LOCAL kontrol.audit_source = %L', source_text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.archive_old_audit_logs IS 'KONTROL Governance - Auto Archival Policy v1.0';
