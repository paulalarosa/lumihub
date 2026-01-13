-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    last_visit TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Allow users to view their own clients
CREATE POLICY "Users can view their own clients" ON public.clients
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own clients
CREATE POLICY "Users can insert their own clients" ON public.clients
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own clients
CREATE POLICY "Users can update their own clients" ON public.clients
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own clients
CREATE POLICY "Users can delete their own clients" ON public.clients
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON public.clients(user_id);
