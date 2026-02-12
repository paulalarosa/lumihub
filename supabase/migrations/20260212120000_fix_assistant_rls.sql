-- FIX ASSISTANT RLS POLICIES
-- This script matches the schema defined in 20260209140000_assistant_portal_schema.sql.

-- 1. Enable RLS
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Assistants can view own data" ON assistants;
DROP POLICY IF EXISTS "Users can view invites by token" ON assistants;
DROP POLICY IF EXISTS "Users can claim their invite" ON assistants;
DROP POLICY IF EXISTS "Public can view invite by token" ON assistants;
DROP POLICY IF EXISTS "Employer can manage their assistants" ON assistants;
DROP POLICY IF EXISTS "Assistants can view own profile" ON assistants;
DROP POLICY IF EXISTS "Assistants can update own profile" ON assistants;
DROP POLICY IF EXISTS "Assistants can manage own profile" ON assistants;
DROP POLICY IF EXISTS "Employers can view their assistants" ON assistants;

-- 3. Policy: Assistants can SELECT/UPDATE their own profile
CREATE POLICY "Assistants can manage own profile"
ON assistants
FOR ALL
USING (user_id = auth.uid());

-- 4. Policy: Employers can VIEW assistants they have access to
CREATE POLICY "Employers can view their assistants"
ON assistants
FOR SELECT
USING (
  id IN (
    SELECT assistant_id 
    FROM public.assistant_access 
    WHERE makeup_artist_id IN (
      SELECT id FROM public.makeup_artists WHERE user_id = auth.uid()
    )
    AND status = 'active'
  )
);

-- Note: "Users can claim their invite" is removed because:
-- 1. `assistants` table has NOT NULL user_id, so rows are created assigned.
-- 2. `accept_assistant_invite` function handles creation/linking securely.
-- 3. `email` column does not exist on `assistants` table.

-- Note: "Public can view invite by token" is removed from `assistants` because:
-- 1. `invite_token` exists on `assistant_invites`, not `assistants`.
-- 2. Validate invite logic checks `assistant_invites` table.
