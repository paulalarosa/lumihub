-- Tabela de progresso de onboarding
CREATE TABLE IF NOT EXISTS user_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progresso
  current_step text DEFAULT 'welcome',
  completed_steps text[] DEFAULT ARRAY[]::text[],
  is_completed boolean DEFAULT false,
  
  -- Tour interativo
  has_seen_tour boolean DEFAULT false,
  tour_step integer DEFAULT 0,
  
  -- Badges/Conquistas desbloqueadas
  unlocked_badges text[] DEFAULT ARRAY[]::text[],
  
  -- Configuração inicial
  business_info_completed boolean DEFAULT false,
  first_client_added boolean DEFAULT false,
  first_event_created boolean DEFAULT false,
  first_contract_generated boolean DEFAULT false,
  calendar_synced boolean DEFAULT false,
  profile_customized boolean DEFAULT false,
  
  -- Timestamps
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint on user_id
  CONSTRAINT user_onboarding_user_id_key UNIQUE (user_id)
);

-- Tabela de conquistas/badges
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Badge info
  badge_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL, -- emoji ou nome do ícone
  category text CHECK (category IN ('onboarding', 'engagement', 'growth', 'social', 'expert')),
  
  -- Critérios
  requirement_type text NOT NULL, -- count, boolean, milestone
  requirement_value integer,
  
  -- Recompensa
  reward_message text,
  
  created_at timestamptz DEFAULT now()
);

-- Tabela de badges desbloqueados por usuário
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text REFERENCES achievements(badge_id) ON DELETE CASCADE,
  
  -- Quando desbloqueou
  unlocked_at timestamptz DEFAULT now(),
  
  -- Se já viu a notificação
  is_new boolean DEFAULT true,
  seen_at timestamptz,
  
  UNIQUE(user_id, badge_id)
);

-- Tabela de dicas contextuais
CREATE TABLE IF NOT EXISTS contextual_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Localização da dica
  page_path text NOT NULL, -- /clientes, /agenda, etc
  element_selector text, -- #add-client-btn
  
  -- Conteúdo
  title text NOT NULL,
  content text NOT NULL,
  
  -- Trigger
  show_when text, -- page_load, first_visit, element_hover
  show_after_days integer DEFAULT 0,
  
  -- Ordenação
  display_order integer DEFAULT 0,
  
  -- Status
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now()
);

-- Tabela de dicas vistas pelo usuário
CREATE TABLE IF NOT EXISTS user_seen_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tip_id uuid REFERENCES contextual_tips(id) ON DELETE CASCADE,
  
  seen_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, tip_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS user_onboarding_user_completed_idx ON user_onboarding(user_id, is_completed);
CREATE INDEX IF NOT EXISTS user_achievements_user_new_idx ON user_achievements(user_id, is_new);
CREATE INDEX IF NOT EXISTS contextual_tips_path_active_idx ON contextual_tips(page_path, is_active);

-- RLS
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_seen_tips ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage own onboarding" ON user_onboarding;
    CREATE POLICY "Users can manage own onboarding"
      ON user_onboarding FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
    CREATE POLICY "Users can view own achievements"
      ON user_achievements FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can manage own tips" ON user_seen_tips;
    CREATE POLICY "Users can manage own tips"
      ON user_seen_tips FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
END $$;

-- Seed: Conquistas padrão
INSERT INTO achievements (badge_id, name, description, icon, category, requirement_type, requirement_value, reward_message)
VALUES
  ('first_login', 'Primeiro Login', 'Bem-vindo ao Khaos Kontrol!', '👋', 'onboarding', 'boolean', NULL, 'Você deu o primeiro passo!'),
  ('profile_complete', 'Perfil Completo', 'Completou todas as informações do perfil', '✨', 'onboarding', 'boolean', NULL, 'Seu perfil está impecável!'),
  ('first_client', 'Primeira Cliente', 'Cadastrou sua primeira cliente', '🎉', 'onboarding', 'boolean', NULL, 'Sua jornada começou!'),
  ('first_event', 'Primeiro Evento', 'Criou seu primeiro evento na agenda', '📅', 'onboarding', 'boolean', NULL, 'A agenda está se enchendo!'),
  ('social_butterfly', 'Social Queen', 'Conectou Instagram e Google Calendar', '🦋', 'social', 'boolean', NULL, 'Você está conectada!'),
  ('rising_star', 'Estrela em Ascensão', 'Recebeu 5 reviews de 5 estrelas', '⭐', 'growth', 'count', 5, 'Suas clientes te amam!'),
  ('beauty_boss', 'Beauty Boss', 'Completou 10 eventos', '💄', 'growth', 'count', 10, 'Profissionalismo em alta!'),
  ('team_player', 'Trabalho em Equipe', 'Adicionou sua primeira assistente', '👥', 'growth', 'boolean', NULL, 'O time está crescendo!'),
  ('influencer', 'Influencer', 'Publicou 20 posts no Instagram via sistema', '📸', 'social', 'count', 20, 'Você é uma influenciadora!'),
  ('money_maker', 'Money Maker', 'Faturou R$ 10.000 no mês', '💰', 'growth', 'count', 10000, 'Sucesso financeiro!'),
  ('loyal_clients', 'Clientes Fiéis', 'Teve 5 clientes recorrentes', '💕', 'engagement', 'count', 5, 'Fidelização é sua força!'),
  ('early_bird', 'Madrugadora', 'Agendou evento antes das 7h', '🌅', 'engagement', 'boolean', NULL, 'Dedicação total!'),
  ('night_owl', 'Coruja', 'Agendou evento depois das 22h', '🌙', 'engagement', 'boolean', NULL, 'Sem limites de horário!'),
  ('pro_100', 'Centenária', 'Completou 100 eventos', '🏆', 'expert', 'count', 100, 'Você é LEGEND!'),
  ('microsite_pro', 'Presença Online', 'Publicou seu microsite', '🌐', 'onboarding', 'boolean', NULL, 'Agora você está na web!')
ON CONFLICT (badge_id) DO NOTHING;

-- Function: Verificar e desbloquear conquistas
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_achievement record;
  v_count integer;
  -- v_value numeric; -- Removido se não usado
  v_should_unlock boolean;
BEGIN
  FOR v_achievement IN 
    SELECT * FROM achievements 
  LOOP
    -- Verificar se já desbloqueou
    IF EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = p_user_id AND badge_id = v_achievement.badge_id
    ) THEN
      CONTINUE;
    END IF;
    
    v_should_unlock := false;
    
    -- Verificar critério baseado no tipo
    CASE v_achievement.badge_id
      WHEN 'first_login' THEN
        v_should_unlock := true;
        
      WHEN 'profile_complete' THEN
        SELECT COUNT(*) INTO v_count
        FROM user_onboarding
        WHERE user_id = p_user_id AND profile_customized = true;
        v_should_unlock := v_count > 0;
        
      WHEN 'first_client' THEN
        SELECT COUNT(*) INTO v_count
        FROM wedding_clients
        WHERE user_id = p_user_id;
        v_should_unlock := v_count >= 1;
        
      WHEN 'first_event' THEN
        SELECT COUNT(*) INTO v_count
        FROM projects
        WHERE user_id = p_user_id;
        v_should_unlock := v_count >= 1;
        
      WHEN 'rising_star' THEN
        SELECT COUNT(*) INTO v_count
        FROM reviews r
        JOIN projects p ON p.id = r.project_id
        WHERE p.user_id = p_user_id AND r.rating = 5 AND r.status = 'approved';
        v_should_unlock := v_count >= 5;
        
      WHEN 'beauty_boss' THEN
        SELECT COUNT(*) INTO v_count
        FROM projects
        WHERE user_id = p_user_id AND status = 'completed';
        v_should_unlock := v_count >= 10;
        
      WHEN 'pro_100' THEN
        SELECT COUNT(*) INTO v_count
        FROM projects
        WHERE user_id = p_user_id AND status = 'completed';
        v_should_unlock := v_count >= 100;
        
      WHEN 'microsite_pro' THEN
        SELECT COUNT(*) INTO v_count
        FROM microsites
        WHERE user_id = p_user_id AND is_published = true;
        v_should_unlock := v_count > 0;
        
      ELSE
        NULL;
    END CASE;
    
    -- Desbloquear se critério foi atingido
    IF v_should_unlock THEN
      INSERT INTO user_achievements (user_id, badge_id)
      VALUES (p_user_id, v_achievement.badge_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Trigger: Verificar conquistas após inserções
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM check_and_unlock_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Aplicar em tabelas relevantes (Drop before create to ensure idempotency)
DROP TRIGGER IF EXISTS after_client_insert ON wedding_clients;
CREATE TRIGGER after_client_insert
  AFTER INSERT ON wedding_clients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

DROP TRIGGER IF EXISTS after_project_insert ON projects;
CREATE TRIGGER after_project_insert
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_achievements();

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    DROP TRIGGER IF EXISTS after_review_insert ON reviews;
    CREATE TRIGGER after_review_insert
      AFTER INSERT ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION trigger_check_achievements();
  END IF;
END $$;
