-- Creating missing user_ai_settings table
CREATE TABLE IF NOT EXISTS user_ai_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL DEFAULT 'openai',
    api_key text,
    model_name text DEFAULT 'gpt-4o-mini',
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT user_ai_settings_user_id_key UNIQUE (user_id)
);

-- RLS for user_ai_settings
ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ai settings" ON user_ai_settings;
CREATE POLICY "Users can manage own ai settings"
    ON user_ai_settings FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Fix RLS for audit_logs
-- Enable insert for authenticated users so logger.ts action() can persist to DB
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON audit_logs;
CREATE POLICY "Enable insert for authenticated users"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);
