-- Add attachment_url to contracts
ALTER TABLE contracts 
ADD COLUMN attachment_url TEXT;

-- Storage Bucket for Contract Files (PDFs)
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-files', 'contract-files', false);

-- Storage Policies for contract-files
CREATE POLICY "Users can upload contract files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'contract-files' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own contract files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'contract-files' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
