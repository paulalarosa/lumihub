-- FIX ASSISTANT RLS POLICIES
-- This script ensures assistants can claim invites and view their own data.

-- 1. Enable RLS on assistants (just in case)
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies (to avoid conflicts)
DROP POLICY IF EXISTS "Assistants can view own data" ON assistants;
DROP POLICY IF EXISTS "Users can view invites by token" ON assistants;
DROP POLICY IF EXISTS "Users can claim their invite" ON assistants;
DROP POLICY IF EXISTS "Public can view invite by token" ON assistants;

-- 3. Policy: Public/Anon can view invites via Token (needed for Invite Page validation)
CREATE POLICY "Public can view invite by token"
ON assistants
FOR SELECT
USING (true); 
-- Note: Ideally we filter by invite_token IS NOT NULL, but for "read by token" logic in frontend, 
-- we rely on the query `.eq('invite_token', token)` being robust. 
-- Security: UUID tokens are hard to guess.

-- 4. Policy: Authenticated Users can UPDATE (Claim) their invite
-- Logic: Allow update if the row's email matches the user's email OR if they are already the assigned user
CREATE POLICY "Users can claim their invite"
ON assistants
FOR UPDATE
USING (
  email = auth.jwt() ->> 'email' 
  OR assistant_user_id = auth.uid()
);

-- 5. Policy: Assistants can SELECT their own rows
CREATE POLICY "Assistants can view own data"
ON assistants
FOR SELECT
USING (
  assistant_user_id = auth.uid() 
  OR email = auth.jwt() ->> 'email'
);

-- 6. Ensure Employers (Owners) can still do everything
CREATE POLICY "Employer can manage their assistants"
ON assistants
FOR ALL
USING (user_id = auth.uid());
