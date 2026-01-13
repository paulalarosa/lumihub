-- Create treatment_records table
CREATE TABLE IF NOT EXISTS public.treatment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    service_name TEXT,
    notes TEXT,
    photos TEXT[], -- Array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.treatment_records ENABLE ROW LEVEL SECURITY;

-- Policies for treatment_records
CREATE POLICY "Users can CRUD their own records" ON public.treatment_records
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create Storage Bucket 'client-photos'
-- Note: This requires appropriate permissions. If it fails, create via Dashboard.
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'client-photos'
-- Allow authenticated users to view all photos (or restrict to own folder structure if preferred)
-- Here we imply a structure like `user_id/client_id/filename` for stricter RLS if needed,
-- but for simplicity we'll allow auth users to read/write.

-- Policy: Give users access to their own folder 
CREATE POLICY "Give users access to own folder 1okq_0" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'client-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Give users access to own folder 1okq_1" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Give users access to own folder 1okq_2" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'client-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fallback simple policy if folder structure isn't strictly enforced yet
-- (Commented out in favor of folder-based security ideally, but enabling basic access for dev)
-- CREATE POLICY "Authenticated users can upload photos" ON storage.objects
-- FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-photos');
-- CREATE POLICY "Authenticated users can select photos" ON storage.objects
-- FOR SELECT TO authenticated USING (bucket_id = 'client-photos');
