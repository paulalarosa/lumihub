-- Create contracts table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed')),
    signature_url TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own contracts" ON contracts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own contracts" ON contracts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own contracts" ON contracts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own contracts" ON contracts
    FOR DELETE USING (user_id = auth.uid());

-- Storage Bucket for Signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-signatures', 'contract-signatures', true);

-- Storage Policies
CREATE POLICY "Public Read Signatures"
ON storage.objects FOR SELECT
USING ( bucket_id = 'contract-signatures' );

CREATE POLICY "Users can upload signatures"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'contract-signatures' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
