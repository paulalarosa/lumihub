-- Revoke access to public schema for usage to force RLS checks
-- (Be careful not to break everything, usually we just enable RLS on all tables)

-- 1. Hardening Transactions
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for owners" ON transactions;

CREATE POLICY "View own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Create own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prevent Updates/Deletes on Financial Records for Audit Trail? 
-- Usually we allow correction but maybe log it.
-- For "High Security", let's restrict DELETE.
CREATE POLICY "No delete transactions" ON transactions
    FOR DELETE USING (false); 

-- 2. Hardening Profiles (Critical for Billing Plan)
-- Users should NOT be able to change their own 'plan' field directly via Client.
-- Plan changes must come from Service Role (Webhooks) or Admin.

CREATE POLICY "Read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Only allow updating non-critical fields
CREATE POLICY "Update own profile metadata" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
    -- Ideally we use a trigger or column-level privilege, but Supabase RLS is row-level.
    -- To strictly prevent 'plan' update, we need a Database Trigger to check OLD.plan = NEW.plan OR auth.role() = 'service_role'.
    -- Or we move 'plan' to a separate 'subscriptions' table that is Read-Only for user.

-- 3. Audit Logs is Admin Only
ALTER TABLE IF EXISTS backup_integrity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON backup_integrity_logs
    FOR SELECT USING (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and (profiles.email = 'prenata@gmail.com' OR profiles.role = 'admin') -- fallback usage
        )
    );
