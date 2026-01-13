-- Add invite_code column to assistant_invites
ALTER TABLE assistant_invites 
ADD COLUMN invite_code TEXT UNIQUE;

-- Create index for faster lookup
CREATE INDEX idx_assistant_invites_code ON assistant_invites(invite_code);
