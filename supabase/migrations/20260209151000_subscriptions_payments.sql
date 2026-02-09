-- Subscriptions and Payments Schema
-- Enables assistants to upgrade to full accounts via Mercado Pago

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('basic', 'pro', 'enterprise')) DEFAULT 'pro',
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')) DEFAULT 'active',
  
  -- Mercado Pago Integration
  mp_subscription_id text UNIQUE,
  mp_payer_id text,
  mp_preference_id text,
  
  -- Pricing
  price_monthly numeric NOT NULL,
  currency text DEFAULT 'BRL',
  
  -- Dates
  trial_ends_at timestamptz,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  cancelled_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments Table (Transaction History)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment Details
  amount numeric NOT NULL,
  currency text DEFAULT 'BRL',
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')) DEFAULT 'pending',
  
  -- Mercado Pago
  mp_payment_id text UNIQUE,
  mp_preference_id text,
  payment_method text, -- 'pix', 'credit_card', 'debit_card', 'boleto'
  payment_type text, -- 'subscription', 'one_time'
  
  -- Metadata
  description text,
  metadata jsonb,
  
  -- Timestamps
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_mp_id ON public.subscriptions(mp_subscription_id) WHERE mp_subscription_id IS NOT NULL;
CREATE UNIQUE INDEX idx_subscriptions_active_user ON public.subscriptions(user_id) WHERE status = 'active';

CREATE INDEX idx_payments_subscription ON public.payments(subscription_id);
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_mp_id ON public.payments(mp_payment_id) WHERE mp_payment_id IS NOT NULL;
CREATE INDEX idx_payments_created ON public.payments(created_at DESC);

-- RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Subscriptions Policies
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Payments Policies
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (true); -- Webhook needs to insert

CREATE POLICY "System can update payments"
  ON public.payments FOR UPDATE
  USING (true); -- Webhook needs to update

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper Function: Get Active Subscription
CREATE OR REPLACE FUNCTION get_active_subscription(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  plan_type text,
  status text,
  current_period_end timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.plan_type, s.status, s.current_period_end
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Check if User Has Active Subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND current_period_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.subscriptions IS 'User subscription plans and billing information';
COMMENT ON TABLE public.payments IS 'Payment transaction history';
COMMENT ON COLUMN public.subscriptions.mp_subscription_id IS 'Mercado Pago subscription ID';
COMMENT ON COLUMN public.payments.mp_payment_id IS 'Mercado Pago payment ID';
COMMENT ON COLUMN public.payments.payment_method IS 'Payment method: pix, credit_card, debit_card, boleto';
