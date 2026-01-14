-- Create backup_integrity_logs table
CREATE TABLE IF NOT EXISTS backup_integrity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    admin_email TEXT NOT NULL,
    checksum TEXT, -- Simple checksum of the details + action + time for integrity verification
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE backup_integrity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can view all logs
CREATE POLICY "Admins can view all logs"
    ON backup_integrity_logs
    FOR SELECT
    USING (
      auth.jwt() ->> 'email' = 'prenata@gmail.com' 
      OR 
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );

-- Only system/admin can insert (enforced via application logic mostly, or simple policy)
CREATE POLICY "Admins can insert logs"
    ON backup_integrity_logs
    FOR INSERT
    WITH CHECK (
      auth.jwt() ->> 'email' = 'prenata@gmail.com' 
      OR 
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );
