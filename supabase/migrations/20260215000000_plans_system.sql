-- ============================================
-- SISTEMA DE PLANOS E ASSINATURAS
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Atualizar tabela makeup_artists
-- Usando DO block para garantir que não quebre se colunas/constraints já existirem parcialmente
DO $$ 
BEGIN
    -- plan_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='makeup_artists' AND column_name='plan_type') THEN
        ALTER TABLE public.makeup_artists ADD COLUMN plan_type text DEFAULT 'essencial';
    END IF;
    
    -- plan_status (ou subscription_status se preferir, mas o prompt pede plan_status)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='makeup_artists' AND column_name='plan_status') THEN
        ALTER TABLE public.makeup_artists ADD COLUMN plan_status text DEFAULT 'trialing';
    END IF;

    -- stripe cols
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='makeup_artists' AND column_name='stripe_customer_id') THEN
        ALTER TABLE public.makeup_artists ADD COLUMN stripe_customer_id text UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='makeup_artists' AND column_name='stripe_subscription_id') THEN
        ALTER TABLE public.makeup_artists ADD COLUMN stripe_subscription_id text UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='makeup_artists' AND column_name='plan_started_at') THEN
        ALTER TABLE public.makeup_artists ADD COLUMN plan_started_at timestamptz DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='makeup_artists' AND column_name='plan_expires_at') THEN
        ALTER TABLE public.makeup_artists ADD COLUMN plan_expires_at timestamptz;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='makeup_artists' AND column_name='trial_ends_at') THEN
        ALTER TABLE public.makeup_artists ADD COLUMN trial_ends_at timestamptz DEFAULT (now() + interval '14 days');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='makeup_artists' AND column_name='monthly_price') THEN
        ALTER TABLE public.makeup_artists ADD COLUMN monthly_price numeric DEFAULT 39.90;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='makeup_artists' AND column_name='billing_cycle_anchor') THEN
        ALTER TABLE public.makeup_artists ADD COLUMN billing_cycle_anchor timestamptz;
    END IF;
END $$;

-- Aplicar CHECK constraints separadamente para segurança
ALTER TABLE public.makeup_artists DROP CONSTRAINT IF EXISTS makeup_artists_plan_type_check;
ALTER TABLE public.makeup_artists ADD CONSTRAINT makeup_artists_plan_type_check CHECK (plan_type IN ('essencial', 'profissional', 'studio'));

ALTER TABLE public.makeup_artists DROP CONSTRAINT IF EXISTS makeup_artists_plan_status_check;
ALTER TABLE public.makeup_artists ADD CONSTRAINT makeup_artists_plan_status_check CHECK (plan_status IN ('active', 'trialing', 'cancelled', 'past_due', 'paused'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_makeup_artists_plan ON public.makeup_artists(plan_type, plan_status);
CREATE INDEX IF NOT EXISTS idx_makeup_artists_stripe ON public.makeup_artists(stripe_customer_id);

-- 2. Tabela de configuração dos planos
CREATE TABLE IF NOT EXISTS public.plan_configs (
  plan_type text PRIMARY KEY,
  display_name text NOT NULL,
  monthly_price numeric NOT NULL,
  stripe_price_id text NOT NULL UNIQUE,
  max_clients integer,
  max_projects_per_month integer,
  max_team_members integer NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir planos com os price_ids do Stripe fornecidos
INSERT INTO public.plan_configs (plan_type, display_name, monthly_price, stripe_price_id, max_clients, max_team_members, features, sort_order)
VALUES 
(
  'essencial',
  'Essencial',
  39.90,
  'price_1T06IGPuhubKL3n8c8sTgvsu',
  50,
  0,
  '{
    "agenda": true,
    "contratos_digitais": true,
    "portal_cliente": true,
    "calendario": true,
    "galeria": true,
    "pack_tecnico": "basico",
    "analytics": false,
    "portal_noiva_custom": false,
    "microsite": false,
    "ficha_anamnese": false,
    "gestao_equipe": false,
    "ia_operacional": false,
    "ia_widgets": false,
    "ia_canvas": false,
    "ia_local": false,
    "performance_artista": false,
    "multi_usuario": false,
    "integracao_api": false,
    "suporte": "whatsapp"
  }'::jsonb,
  1
),
(
  'profissional',
  'Profissional',
  89.90,
  'price_1T06JHPuhubKL3n88FuAacvY',
  NULL,
  0,
  '{
    "agenda": true,
    "contratos_digitais": true,
    "portal_cliente": true,
    "calendario": true,
    "galeria": true,
    "pack_tecnico": "gold",
    "analytics": true,
    "portal_noiva_custom": true,
    "microsite": true,
    "ficha_anamnese": true,
    "gestao_equipe": false,
    "ia_operacional": true,
    "ia_widgets": true,
    "ia_canvas": false,
    "ia_local": false,
    "performance_artista": false,
    "multi_usuario": false,
    "integracao_api": false,
    "suporte": "email"
  }'::jsonb,
  2
),
(
  'studio',
  'Studio',
  149.90,
  'price_1T06JePuhubKL3n8AEQBTYtV',
  NULL,
  10,
  '{
    "agenda": true,
    "contratos_digitais": true,
    "portal_cliente": true,
    "calendario": true,
    "galeria": true,
    "pack_tecnico": "premium",
    "analytics": true,
    "portal_noiva_custom": true,
    "microsite": true,
    "ficha_anamnese": true,
    "gestao_equipe": true,
    "ia_operacional": true,
    "ia_widgets": true,
    "ia_canvas": true,
    "ia_local": true,
    "performance_artista": true,
    "multi_usuario": true,
    "integracao_api": true,
    "suporte": "prioritario"
  }'::jsonb,
  3
)
ON CONFLICT (plan_type) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  stripe_price_id = EXCLUDED.stripe_price_id,
  max_clients = EXCLUDED.max_clients,
  max_team_members = EXCLUDED.max_team_members,
  features = EXCLUDED.features;

-- 3. Tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id text UNIQUE,
  stripe_invoice_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'BRL',
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_method text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON public.payment_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe ON public.payment_history(stripe_payment_intent_id);

-- 4. Function para verificar acesso a features
CREATE OR REPLACE FUNCTION check_feature_access(
  p_user_id uuid,
  p_feature text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_type text;
  v_plan_status text;
  v_trial_ends_at timestamptz;
  v_features jsonb;
  v_has_feature boolean;
BEGIN
  -- Buscar dados do plano
  SELECT ma.plan_type, ma.plan_status, ma.trial_ends_at, pc.features
  INTO v_plan_type, v_plan_status, v_trial_ends_at, v_features
  FROM makeup_artists ma
  JOIN plan_configs pc ON pc.plan_type = ma.plan_type
  WHERE ma.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'user_not_found'
    );
  END IF;

  -- Verificar se plano está ativo ou em trial válido
  IF v_plan_status != 'active' THEN
    IF v_plan_status = 'trialing' AND v_trial_ends_at > now() THEN
      -- Trial ainda válido, permitir
      NULL;
    ELSE
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'plan_inactive',
        'plan_status', v_plan_status,
        'trial_expired', v_trial_ends_at < now()
      );
    END IF;
  END IF;

  -- Verificar se feature existe no plano
  v_has_feature := (v_features->p_feature)::boolean;

  IF v_has_feature IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'feature_not_found'
    );
  END IF;

  IF NOT v_has_feature THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'feature_not_in_plan',
      'current_plan', v_plan_type,
      'required_plan', (
        SELECT pc2.plan_type 
        FROM plan_configs pc2
        WHERE (pc2.features->p_feature)::boolean = true
        ORDER BY pc2.sort_order 
        LIMIT 1
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'plan_type', v_plan_type
  );
END;
$$;

-- 5. Function para verificar limites (ex: max_clients)
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id uuid,
  p_resource text -- 'clients', 'projects', 'team_members'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count integer;
  v_max_limit integer;
  v_plan_type text;
BEGIN
  -- Buscar limite do plano
  SELECT ma.plan_type, 
    CASE p_resource
      WHEN 'clients' THEN pc.max_clients
      WHEN 'team_members' THEN pc.max_team_members
    END
  INTO v_plan_type, v_max_limit
  FROM makeup_artists ma
  JOIN plan_configs pc ON pc.plan_type = ma.plan_type
  WHERE ma.user_id = p_user_id;

  -- Se limite é NULL = ilimitado
  IF v_max_limit IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'limit', 'unlimited');
  END IF;

  -- Contar uso atual
  IF p_resource = 'clients' THEN
    SELECT COUNT(*) INTO v_current_count
    FROM wedding_clients
    WHERE user_id = p_user_id;
  ELSIF p_resource = 'team_members' THEN
    SELECT COUNT(*) INTO v_current_count
    FROM assistant_access
    WHERE makeup_artist_id = (SELECT id FROM makeup_artists WHERE user_id = p_user_id)
      AND status = 'active';
  END IF;

  -- Verificar se atingiu limite
  IF v_current_count >= v_max_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'limit_reached',
      'current', v_current_count,
      'limit', v_max_limit,
      'plan_type', v_plan_type
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'current', v_current_count,
    'limit', v_max_limit,
    'remaining', v_max_limit - v_current_count
  );
END;
$$;

-- 6. RLS Policies
ALTER TABLE public.plan_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plan configs" ON public.plan_configs;
CREATE POLICY "Anyone can view plan configs"
  ON public.plan_configs FOR SELECT
  USING (is_active = true);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment history" ON public.payment_history;
CREATE POLICY "Users can view own payment history"
  ON public.payment_history FOR SELECT
  USING (auth.uid() = user_id);

-- 7. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_plan_configs_updated_at ON plan_configs;
CREATE TRIGGER update_plan_configs_updated_at 
  BEFORE UPDATE ON plan_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
