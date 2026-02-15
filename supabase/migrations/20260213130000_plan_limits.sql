-- Adicionar campos de plano e limites
ALTER TABLE public.makeup_artists 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'essencial' 
  CHECK (plan_type IN ('essencial', 'profissional', 'studio')),
ADD COLUMN IF NOT EXISTS plan_status text DEFAULT 'active' 
  CHECK (plan_status IN ('active', 'cancelled', 'past_due', 'trialing')),
ADD COLUMN IF NOT EXISTS plan_started_at timestamptz,
ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS monthly_price numeric DEFAULT 39.90,
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Índice
CREATE INDEX IF NOT EXISTS idx_makeup_artists_plan ON public.makeup_artists(plan_type, plan_status);

-- CRIAR TABELA DE LIMITES DOS PLANOS
CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan_type text PRIMARY KEY,
  max_clients integer,
  max_projects_per_month integer,
  max_team_members integer,
  features jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to plan limits" ON public.plan_limits;

-- DROP POLICY IF EXISTS "Public read access to plan limits" ON public.plan_limits;
-- CREATE POLICY "Public read access to plan limits" 
-- ON public.plan_limits FOR SELECT 
-- TO authenticated, anon 
-- USING (true);

-- Inserir configuração dos planos
INSERT INTO public.plan_limits (plan_type, max_clients, max_projects_per_month, max_team_members, features)
VALUES 
(
  'essencial',
  50, -- max clientes
  NULL, -- projetos ilimitados
  0, -- sem equipe
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
    "performance_artista": false,
    "multi_usuario": false,
    "integracao_api": false,
    "suporte": "whatsapp"
  }'::jsonb
),
(
  'profissional',
  NULL, -- clientes ilimitados
  NULL,
  0, -- sem equipe
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
    "ia_operacional": false,
    "performance_artista": false,
    "multi_usuario": false,
    "integracao_api": false,
    "suporte": "email"
  }'::jsonb
),
(
  'studio',
  NULL, -- ilimitados
  NULL,
  10, -- até 10 membros de equipe
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
    "performance_artista": true,
    "multi_usuario": true,
    "integracao_api": true,
    "suporte": "prioritario"
  }'::jsonb
)
ON CONFLICT (plan_type) DO UPDATE SET
  max_clients = EXCLUDED.max_clients,
  max_projects_per_month = EXCLUDED.max_projects_per_month,
  max_team_members = EXCLUDED.max_team_members,
  features = EXCLUDED.features;

-- Helper: qual plano tem essa feature
CREATE OR REPLACE FUNCTION get_required_plan(p_feature text)
RETURNS text
LANGUAGE sql
AS $$
  SELECT plan_type
  FROM plan_limits
  WHERE features->p_feature = 'true'::jsonb
  ORDER BY 
    CASE plan_type
      WHEN 'essencial' THEN 1
      WHEN 'profissional' THEN 2
      WHEN 'studio' THEN 3
    END
  LIMIT 1;
$$;

-- FUNCTION PARA VERIFICAR LIMITES
CREATE OR REPLACE FUNCTION check_plan_limit(
  p_user_id uuid,
  p_feature text,
  p_count integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_type text;
  v_plan_status text;
  v_limits record;
  v_current_count integer;
BEGIN
  -- Buscar plano do usuário
  SELECT plan_type, plan_status INTO v_plan_type, v_plan_status
  FROM makeup_artists
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'user_not_found'
    );
  END IF;

  -- Verificar se plano está ativo
  IF v_plan_status != 'active' AND v_plan_status != 'trialing' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'plan_inactive',
      'plan_status', v_plan_status
    );
  END IF;

  -- Buscar limites do plano
  SELECT * INTO v_limits
  FROM plan_limits
  WHERE plan_type = v_plan_type;

  -- Verificar feature específica
  IF p_feature = 'max_clients' THEN
    IF v_limits.max_clients IS NULL THEN
      -- Ilimitado
      RETURN jsonb_build_object('allowed', true, 'limit', 'unlimited');
    END IF;

    -- Contar clientes atuais
    SELECT COUNT(*) INTO v_current_count
    FROM wedding_clients
    WHERE user_id = p_user_id;

    IF v_current_count >= v_limits.max_clients THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'limit_reached',
        'current', v_current_count,
        'limit', v_limits.max_clients
      );
    END IF;

    RETURN jsonb_build_object(
      'allowed', true,
      'current', v_current_count,
      'limit', v_limits.max_clients
    );
  END IF;

  -- Verificar acesso a feature booleana
  IF v_limits.features ? p_feature THEN
    IF (v_limits.features->p_feature)::boolean = true THEN
      RETURN jsonb_build_object('allowed', true);
    ELSE
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'feature_not_in_plan',
        'required_plan', get_required_plan(p_feature)
      );
    END IF;
  END IF;

  -- Feature não encontrada
  RETURN jsonb_build_object(
    'allowed', false,
    'reason', 'feature_unknown'
  );
END;
$$;
