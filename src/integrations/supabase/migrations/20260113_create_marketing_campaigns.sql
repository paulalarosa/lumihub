-- Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- The message template
    category TEXT DEFAULT 'general', -- 'casual', 'promo', 'news'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own campaigns"
    ON marketing_campaigns
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Seed default campaigns for all existing users (optional, or handle in frontend default)
-- For now, let's just insert some default ones if the table is empty for the current user in logic,
-- OR we can insert system-wide defaults if we had a 'system' user, but simplest is to have user-specific copies.

-- Let's just create the table. The frontend will fallback to defaults if fetch returns empty, and allow saving templates.
