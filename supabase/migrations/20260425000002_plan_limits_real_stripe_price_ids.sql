-- Real Stripe Price IDs criados em 2026-04-25 (modo live, products
-- ACESSO ESSENCIAL/PROFISSIONAL/STUDIO). Price IDs não são secrets —
-- vão pro client durante checkout.

UPDATE public.plan_limits
  SET stripe_price_id = 'price_1T1EbjLrk3pIMja5u0UtzmG4'
  WHERE plan_type = 'essencial';

UPDATE public.plan_limits
  SET stripe_price_id = 'price_1T1EbjLrk3pIMja5HuONOIFi'
  WHERE plan_type = 'profissional';

UPDATE public.plan_limits
  SET stripe_price_id = 'price_1T1EbmLrk3pIMja5DbScVvvW'
  WHERE plan_type = 'studio';
