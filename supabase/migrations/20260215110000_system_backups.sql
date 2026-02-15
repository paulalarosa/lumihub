-- Create a private bucket for system backups
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('system_backups', 'system_backups', false, false, 52428800, ARRAY['application/json', 'application/zip']);

-- Policy: Only Admins can upload backups (via Edge Function with Service Role)
CREATE POLICY "Admins can upload backups"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK ( bucket_id = 'system_backups' );

-- Policy: Only Admins can read backups
CREATE POLICY "Admins can read backups"
ON storage.objects FOR SELECT
TO service_role
USING ( bucket_id = 'system_backups' );
