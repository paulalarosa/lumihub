-- Tabela de conexões Instagram
CREATE TABLE IF NOT EXISTS instagram_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  makeup_artist_id uuid REFERENCES makeup_artists(id) ON DELETE CASCADE,
  
  -- Instagram account
  instagram_user_id text NOT NULL,
  username text NOT NULL,
  profile_picture_url text,
  
  -- Tokens
  access_token text NOT NULL,
  token_expires_at timestamptz,
  
  -- Permissões concedidas
  scopes text[] DEFAULT ARRAY[]::text[],
  
  -- Stats
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  media_count integer DEFAULT 0,
  
  -- Status
  is_connected boolean DEFAULT true,
  last_synced_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de posts agendados
CREATE TABLE IF NOT EXISTS instagram_scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_connection_id uuid REFERENCES instagram_connections(id) ON DELETE CASCADE,
  
  -- Conteúdo
  caption text NOT NULL,
  media_urls text[] NOT NULL,
  media_type text CHECK (media_type IN ('image', 'video', 'carousel')),
  
  -- Hashtags
  hashtags text[] DEFAULT ARRAY[]::text[],
  
  -- Localização
  location_id text,
  location_name text,
  
  -- Agendamento
  scheduled_for timestamptz NOT NULL,
  timezone text DEFAULT 'America/Sao_Paulo',
  
  -- Status
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  published_at timestamptz,
  
  -- Instagram IDs
  instagram_media_id text,
  instagram_permalink text,
  
  -- Erro
  error_message text,
  retry_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Tabela de posts publicados (analytics)
CREATE TABLE IF NOT EXISTS instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_connection_id uuid REFERENCES instagram_connections(id) ON DELETE CASCADE,
  
  -- Instagram data
  instagram_media_id text UNIQUE NOT NULL,
  media_type text,
  media_url text,
  permalink text,
  caption text,
  timestamp timestamptz,
  
  -- Engagement (updated daily)
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  saved_count integer DEFAULT 0,
  reach integer DEFAULT 0,
  impressions integer DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  
  -- Sincronização
  last_synced_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now()
);

-- Tabela de hashtags sugeridas (IA)
CREATE TABLE IF NOT EXISTS instagram_hashtag_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Categoria
  category text NOT NULL, -- makeup, wedding, beauty, party, etc
  
  -- Hashtags
  hashtags text[] NOT NULL,
  
  -- Performance
  avg_reach numeric DEFAULT 0,
  usage_count integer DEFAULT 0,
  
  -- IA generated
  generated_by_ai boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- Tabela de mensagens diretas (DMs)
CREATE TABLE IF NOT EXISTS instagram_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_connection_id uuid REFERENCES instagram_connections(id) ON DELETE CASCADE,
  
  -- Conversa
  conversation_id text NOT NULL,
  
  -- Participantes
  sender_id text NOT NULL,
  sender_username text,
  recipient_id text NOT NULL,
  
  -- Mensagem
  message_text text,
  message_timestamp timestamptz NOT NULL,
  
  -- Tipo
  is_from_customer boolean DEFAULT true,
  
  -- Status
  is_read boolean DEFAULT false,
  read_at timestamptz,
  
  -- Reply
  replied_at timestamptz,
  reply_text text,
  
  created_at timestamptz DEFAULT now()
);

-- Tabela de templates de posts
CREATE TABLE IF NOT EXISTS instagram_post_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template
  name text NOT NULL,
  caption_template text NOT NULL,
  hashtags text[] DEFAULT ARRAY[]::text[],
  
  -- Categoria
  category text, -- before_after, work_of_day, testimonial, tip, promo
  
  -- Uso
  usage_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS instagram_connections_user_connected_idx ON instagram_connections(user_id, is_connected);
CREATE INDEX IF NOT EXISTS instagram_scheduled_posts_user_status_idx ON instagram_scheduled_posts(user_id, status, scheduled_for);
CREATE INDEX IF NOT EXISTS instagram_posts_connection_time_idx ON instagram_posts(instagram_connection_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS instagram_messages_conversation_idx ON instagram_messages(conversation_id, message_timestamp DESC);
CREATE INDEX IF NOT EXISTS instagram_messages_connection_read_idx ON instagram_messages(instagram_connection_id, is_read);

-- RLS
ALTER TABLE instagram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_hashtag_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_post_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage own instagram connection" ON instagram_connections;
    CREATE POLICY "Users can manage own instagram connection"
      ON instagram_connections FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can manage own scheduled posts" ON instagram_scheduled_posts;
    CREATE POLICY "Users can manage own scheduled posts"
      ON instagram_scheduled_posts FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can view own posts analytics" ON instagram_posts;
    CREATE POLICY "Users can view own posts analytics"
      ON instagram_posts FOR SELECT
      USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can manage own messages" ON instagram_messages;
    CREATE POLICY "Users can manage own messages"
      ON instagram_messages FOR ALL
      USING (
        instagram_connection_id IN (
          SELECT id FROM instagram_connections WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can manage own hashtag suggestions" ON instagram_hashtag_suggestions;
    CREATE POLICY "Users can manage own hashtag suggestions"
        ON instagram_hashtag_suggestions FOR ALL
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can manage own post templates" ON instagram_post_templates;
    CREATE POLICY "Users can manage own post templates"
        ON instagram_post_templates FOR ALL
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
END $$;

-- Function: Atualizar token expirado
CREATE OR REPLACE FUNCTION refresh_instagram_token(p_connection_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implementar refresh de token via Meta Graph API
  -- Nota: Tokens de longa duração duram 60 dias
  NULL;
END;
$$;

-- Function: Calcular engagement rate
CREATE OR REPLACE FUNCTION calculate_engagement_rate(
  p_likes integer,
  p_comments integer,
  p_saves integer,
  p_followers integer
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ROUND(
    ((p_likes + p_comments + p_saves)::numeric / NULLIF(p_followers, 0)) * 100,
    2
  );
$$;
