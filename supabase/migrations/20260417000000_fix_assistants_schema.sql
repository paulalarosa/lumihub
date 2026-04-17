-- Migration: Fix Assistants Schema, RLS and Foreign Keys
-- Created: 2026-04-17

-- 1. Make user_id nullable in assistants table
ALTER TABLE public.assistants 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Ensure email, pin, and access_pin columns exist in assistants table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'assistants' AND column_name = 'email') THEN
        ALTER TABLE public.assistants ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'assistants' AND column_name = 'pin') THEN
        ALTER TABLE public.assistants ADD COLUMN pin TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'assistants' AND column_name = 'access_pin') THEN
        ALTER TABLE public.assistants ADD COLUMN access_pin TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'assistants' AND column_name = 'invite_token') THEN
        ALTER TABLE public.assistants ADD COLUMN invite_token TEXT;
    END IF;
END $$;

-- 3. Add Unique constraint on email if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assistants_email_key_unique') THEN
        ALTER TABLE public.assistants ADD CONSTRAINT assistants_email_key_unique UNIQUE (email);
    END IF;
END $$;

-- 4. Fix Foreign Keys to point to assistants instead of profiles
-- Transactions
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_assistant_id_fkey;
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_assistant_id_fkey 
FOREIGN KEY (assistant_id) REFERENCES public.assistants(id) ON DELETE SET NULL;

-- Event Assistants
ALTER TABLE public.event_assistants DROP CONSTRAINT IF EXISTS assistants;
ALTER TABLE public.event_assistants 
ADD CONSTRAINT event_assistants_assistant_id_fkey 
FOREIGN KEY (assistant_id) REFERENCES public.assistants(id) ON DELETE CASCADE;

-- 5. RLS Policies for assistants table
-- Allow professionals to insert into assistants (to create shadow profiles)
DROP POLICY IF EXISTS "Professionals can create assistants" ON public.assistants;
CREATE POLICY "Professionals can create assistants" 
ON public.assistants FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow professionals to update assistants they have access to
DROP POLICY IF EXISTS "Professionals can update their assistants" ON public.assistants;
CREATE POLICY "Professionals can update their assistants" 
ON public.assistants FOR UPDATE
TO authenticated
USING (
    id IN (
        SELECT assistant_id FROM public.assistant_access 
        WHERE makeup_artist_id IN (SELECT id FROM public.makeup_artists WHERE user_id = auth.uid())
    )
);

-- Allow professionals to view assistants they have access to
DROP POLICY IF EXISTS "Professionals can view their assistants" ON public.assistants;
CREATE POLICY "Professionals can view their assistants"
ON public.assistants FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT assistant_id FROM public.assistant_access 
        WHERE makeup_artist_id IN (SELECT id FROM public.makeup_artists WHERE user_id = auth.uid())
    )
);

-- 6. RLS Policies for assistant_access table
-- Allow professionals to manage their assistant access
DROP POLICY IF EXISTS "Professionals can manage assistant access" ON public.assistant_access;
CREATE POLICY "Professionals can manage assistant access" 
ON public.assistant_access FOR ALL
TO authenticated
USING (
    makeup_artist_id IN (SELECT id FROM public.makeup_artists WHERE user_id = auth.uid())
)
WITH CHECK (
    makeup_artist_id IN (SELECT id FROM public.makeup_artists WHERE user_id = auth.uid())
);
