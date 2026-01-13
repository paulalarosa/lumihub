-- Ensure attachment_url exists (safe add)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'attachment_url') THEN
        ALTER TABLE contracts ADD COLUMN attachment_url TEXT;
    END IF;
END $$;
