-- Add financial columns to events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS total_value NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending', -- 'pending' or 'paid'
ADD COLUMN IF NOT EXISTS assistant_commission NUMERIC(10,2) DEFAULT 0.00;

-- Add birth_date to clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add index for efficient querying of birthdays (optional but good practice)
-- CREATE INDEX idx_clients_birth_date ON clients (birth_date);
