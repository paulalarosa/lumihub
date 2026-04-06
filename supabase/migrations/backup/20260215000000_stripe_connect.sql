-- Add Stripe Connect fields to makeup_artists table
ALTER TABLE makeup_artists 
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS charges_enabled boolean DEFAULT false;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_makeup_artists_stripe_account_id ON makeup_artists(stripe_account_id);
