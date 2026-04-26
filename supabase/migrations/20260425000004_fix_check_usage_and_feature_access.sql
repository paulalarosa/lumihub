-- check_usage_limit e check_feature_access referenciavam `plan_configs`,
-- tabela dropada no orphan cleanup de 20/04. Toda chamada quebrava com
-- "relation plan_configs does not exist", deixando os limits do plano
-- Essencial INATIVOS — usuária pagando R$39,90 usava como ilimitado.
-- Esta migration recria as 2 funções apontando pra `plan_limits`.

BEGIN;

CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id uuid,
  p_resource text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_type text;
  v_artist_id uuid;
  v_limit integer;
  v_used integer;
BEGIN
  SELECT plan_type, id
    INTO v_plan_type, v_artist_id
  FROM public.makeup_artists
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_plan_type IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'no_plan');
  END IF;

  CASE p_resource
    WHEN 'clients' THEN
      SELECT max_clients INTO v_limit
        FROM public.plan_limits WHERE plan_type = v_plan_type;
      SELECT count(*) INTO v_used
        FROM public.wedding_clients WHERE user_id = p_user_id;

    WHEN 'team_members' THEN
      SELECT max_team_members INTO v_limit
        FROM public.plan_limits WHERE plan_type = v_plan_type;
      SELECT count(*) INTO v_used
        FROM public.assistant_access
        WHERE makeup_artist_id = v_artist_id AND status = 'active';

    WHEN 'projects' THEN
      SELECT max_projects_per_month INTO v_limit
        FROM public.plan_limits WHERE plan_type = v_plan_type;
      SELECT count(*) INTO v_used
        FROM public.projects
        WHERE user_id = p_user_id
          AND created_at >= date_trunc('month', now());

    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_resource');
  END CASE;

  -- NULL limit = ilimitado (Profissional/Studio têm vários nulls)
  IF v_limit IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'used', v_used,
      'limit', null,
      'unlimited', true
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_used < v_limit,
    'used', v_used,
    'limit', v_limit,
    'remaining', GREATEST(0, v_limit - v_used)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_feature_access(
  p_user_id uuid,
  p_feature text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_type text;
  v_features jsonb;
  v_has_feature boolean;
BEGIN
  SELECT plan_type INTO v_plan_type
  FROM public.makeup_artists
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_plan_type IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'no_plan');
  END IF;

  SELECT features INTO v_features
  FROM public.plan_limits WHERE plan_type = v_plan_type;

  IF v_features IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'plan_not_found');
  END IF;

  v_has_feature := COALESCE((v_features ->> p_feature)::boolean, false);

  RETURN jsonb_build_object(
    'allowed', v_has_feature,
    'plan_type', v_plan_type
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_usage_limit(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_feature_access(uuid, text) TO authenticated;

COMMIT;
