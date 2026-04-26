-- Adiciona suporte a ciclo anual. Price IDs criados no Stripe live em
-- 2026-04-25 com 20% de desconto sobre o mensal (matching Plans.tsx).
-- O mensal continua em stripe_price_id; o anual vai em
-- stripe_price_id_yearly. create-checkout-session escolhe baseado no
-- cycle passado pelo client.

BEGIN;

ALTER TABLE public.plan_limits
  ADD COLUMN IF NOT EXISTS stripe_price_id_yearly text;

UPDATE public.plan_limits
  SET stripe_price_id_yearly = 'price_1TQWIDLrk3pIMja5voVRnoxU'
  WHERE plan_type = 'essencial';

UPDATE public.plan_limits
  SET stripe_price_id_yearly = 'price_1TQWIELrk3pIMja5tln9U5M6'
  WHERE plan_type = 'profissional';

UPDATE public.plan_limits
  SET stripe_price_id_yearly = 'price_1TQWIGLrk3pIMja5a2Jk2woO'
  WHERE plan_type = 'studio';

COMMIT;
