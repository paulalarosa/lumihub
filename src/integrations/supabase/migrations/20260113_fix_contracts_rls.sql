-- Enable RLS on contracts (redundant but safe)
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing restricted policies if any to avoid conflicts (optional/safe to just add new)
DROP POLICY IF EXISTS "Users can manage their own contracts" ON contracts;

-- Create the nuclear policy: Users can do EVERYTHING if they own the record
CREATE POLICY "Users can manage their own contracts"
ON contracts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix Profile Read Policy (if needed for lookups)
-- Ensure users can read profiles of clients they are linked to?
-- Or just allow users to read their own profile.
-- The error "Error loading database" on Contracts might be due to fetching Clients/Profiles.
-- Let's ensure basic profile read is open for authenticated users or public if that was the plan.
-- Previous plan mentioned "Public Read for profiles".
-- Let's reinforce:
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);
