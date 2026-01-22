-- Migration: Integrity Cascade for Assistants
-- Date: 2026-01-22
-- Description: Ensures deleting a Profile (Assistant or Professional) cascades to remove Assistant connections.

-- 1. Modify 'assistants.assistant_user_id'
-- Current: REFERENCES auth.users(id) ON DELETE CASCADE
-- Problem: Admin deletes 'profiles' row, but 'auth.users' remains. We want to delete 'assistants' row when 'profiles' row is deleted.
-- Solution: Change reference to public.profiles(id) OR rely on the fact that if we delete Auth, it cascades.
-- Given requirement: "Ao apagar uma assistente... remover vínculos". 
-- If Admin deletes from profiles, we want this to cascade.
-- Dropping constraint if exists (name assumption or catch-all)

DO $$ 
BEGIN
    -- Drop existing constraints if they exist (Generic approach since names vary)
    -- We can try to alter the column to Drop Constraint
    BEGIN
        ALTER TABLE public.assistants DROP CONSTRAINT IF EXISTS assistants_assistant_user_id_fkey;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- 2. Add Constraint referencing PROFILES (so Admin soft-delete works)
    ALTER TABLE public.assistants
    ADD CONSTRAINT assistants_assistant_user_id_fkey
    FOREIGN KEY (assistant_user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

    -- 3. Modify 'assistants.user_id' (The Professional)
    -- This column was created without FK in original migration.
    BEGIN
        ALTER TABLE public.assistants DROP CONSTRAINT IF EXISTS assistants_user_id_fkey;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    ALTER TABLE public.assistants
    ADD CONSTRAINT assistants_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

    -- 4. Verify 'event_assistants' (Already has cascade, but reinforcing)
    -- event_id -> events(id) ON DELETE CASCADE
    -- assistant_id -> assistants(id) ON DELETE CASCADE
    -- These are usually fine.

END $$;
