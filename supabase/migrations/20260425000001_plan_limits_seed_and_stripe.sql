-- plan_limits foi criada vazia em 20260101000000_base_schema mas nunca
-- seedada. useBilling.planConfig sempre retornava null e
-- create-checkout-session lia de plan_configs (dropada no cleanup de
-- 20/04). Esta migration:
--   1) adiciona stripe_price_id em plan_limits (coluna canônica pra
--      mapear plano → Stripe Price)
--   2) faz seed inicial dos 3 tiers (essencial, profissional, studio)
--      com limits + features matching Plans.tsx
--   3) deixa stripe_price_id NULL — paula vai me passar os IDs reais
--      (price_xxx) do Stripe Dashboard depois pra UPDATE manual.

BEGIN;

ALTER TABLE public.plan_limits
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

INSERT INTO public.plan_limits (
  plan_type,
  max_clients,
  max_team_members,
  max_projects_per_month,
  features,
  stripe_price_id
) VALUES
  (
    'essencial',
    10,
    0,
    20,
    '{
      "google_calendar": true,
      "contracts": true,
      "bride_portal": true,
      "financial_basic": true,
      "analytics": false,
      "moodboard": false,
      "anamnese": false,
      "whatsapp_followup": false,
      "team_management": false,
      "commissions": false,
      "multi_user": false,
      "ai_suggestions": false,
      "priority_support": false,
      "api": false
    }'::jsonb,
    NULL
  ),
  (
    'profissional',
    NULL,
    0,
    NULL,
    '{
      "google_calendar": true,
      "contracts": true,
      "bride_portal": true,
      "financial_basic": true,
      "analytics": true,
      "moodboard": true,
      "anamnese": true,
      "whatsapp_followup": true,
      "team_management": false,
      "commissions": false,
      "multi_user": false,
      "ai_suggestions": false,
      "priority_support": false,
      "api": false
    }'::jsonb,
    NULL
  ),
  (
    'studio',
    NULL,
    NULL,
    NULL,
    '{
      "google_calendar": true,
      "contracts": true,
      "bride_portal": true,
      "financial_basic": true,
      "analytics": true,
      "moodboard": true,
      "anamnese": true,
      "whatsapp_followup": true,
      "team_management": true,
      "commissions": true,
      "multi_user": true,
      "ai_suggestions": true,
      "priority_support": true,
      "api": true
    }'::jsonb,
    NULL
  )
ON CONFLICT (plan_type) DO UPDATE SET
  max_clients = EXCLUDED.max_clients,
  max_team_members = EXCLUDED.max_team_members,
  max_projects_per_month = EXCLUDED.max_projects_per_month,
  features = EXCLUDED.features;
  -- stripe_price_id NÃO é sobrescrito — preserva valor já preenchido manual

COMMIT;
