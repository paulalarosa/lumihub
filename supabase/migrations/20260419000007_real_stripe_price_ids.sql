-- Replace placeholder Stripe price IDs with the real ones from the Stripe dashboard.
-- Prices aligned with what Stripe actually charges (R$49.90 / 99.90 / 199.90).
-- Note: src/pages/Plans.tsx marketing page still shows R$39.90 / 89.90 / 149.90 — needs separate review.

UPDATE public.plan_configs SET
  stripe_price_id = 'price_1T06IGPuhubKL3n8c8sTgvsu',
  monthly_price = 49.90,
  updated_at = now()
WHERE plan_type = 'essencial';

UPDATE public.plan_configs SET
  stripe_price_id = 'price_1T06JHPuhubKL3n88FuAacvY',
  monthly_price = 99.90,
  updated_at = now()
WHERE plan_type = 'profissional';

UPDATE public.plan_configs SET
  stripe_price_id = 'price_1T06JePuhubKL3n8AEQBTYtV',
  monthly_price = 199.90,
  updated_at = now()
WHERE plan_type = 'studio';
