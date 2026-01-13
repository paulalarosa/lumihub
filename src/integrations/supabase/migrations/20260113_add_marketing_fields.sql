-- Add last_contacted_at column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance on last_visit to speed up inactive queries
CREATE INDEX IF NOT EXISTS clients_last_visit_idx ON clients(last_visit);
