-- Seed plan_configs with the 3 plans shown on /planos.
-- stripe_price_id values are placeholders — replace with real Stripe price IDs before charging.

INSERT INTO public.plan_configs (
  plan_type, display_name, monthly_price, stripe_price_id,
  max_clients, max_team_members, max_projects_per_month,
  features, is_active, sort_order
) VALUES
  (
    'essencial',
    'Essencial',
    39.90,
    'price_essencial_placeholder',
    10,
    0,
    NULL,
    jsonb_build_object(
      'calendar_google', true,
      'contracts', true,
      'portal_client', true,
      'financial_basic', true,
      'analytics_full', false,
      'whatsapp_followup', false,
      'team_management', false,
      'commissions', false,
      'priority_support', false,
      'api_access', false
    ),
    true,
    1
  ),
  (
    'profissional',
    'Profissional',
    89.90,
    'price_profissional_placeholder',
    NULL,
    0,
    NULL,
    jsonb_build_object(
      'calendar_google', true,
      'contracts', true,
      'portal_client', true,
      'portal_custom', true,
      'financial_basic', true,
      'analytics_full', true,
      'moodboard', true,
      'anamnese', true,
      'whatsapp_followup', true,
      'team_management', false,
      'commissions', false,
      'priority_support', false,
      'api_access', false
    ),
    true,
    2
  ),
  (
    'studio',
    'Studio',
    149.90,
    'price_studio_placeholder',
    NULL,
    10,
    NULL,
    jsonb_build_object(
      'calendar_google', true,
      'contracts', true,
      'portal_client', true,
      'portal_custom', true,
      'financial_basic', true,
      'analytics_full', true,
      'moodboard', true,
      'anamnese', true,
      'whatsapp_followup', true,
      'team_management', true,
      'commissions', true,
      'multi_user', true,
      'ai_operational', true,
      'priority_support', true,
      'api_access', true
    ),
    true,
    3
  )
ON CONFLICT (plan_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  monthly_price = EXCLUDED.monthly_price,
  max_clients = EXCLUDED.max_clients,
  max_team_members = EXCLUDED.max_team_members,
  max_projects_per_month = EXCLUDED.max_projects_per_month,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
