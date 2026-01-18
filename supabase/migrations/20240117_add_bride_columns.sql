-- Add Bride Portal columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS is_bride BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wedding_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS access_pin TEXT;

-- Create index for faster lookups on access_pin (optional but good for login)
CREATE INDEX IF NOT EXISTS idx_clients_access_pin ON clients(access_pin);
