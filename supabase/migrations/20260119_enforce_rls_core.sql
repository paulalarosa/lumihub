-- Migration: Enforce Strict RLS on Core Tables
-- Date: 2026-01-19
-- Description: Enables RLS on profiles, events, contracts, transactions and sets strict policies.

-- 1. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR (select role from public.profiles where id = auth.uid()) = 'admin');

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 3. Events Policies
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Users can crud own events" ON public.events;
DROP POLICY IF EXISTS "Assistants can view assigned events" ON public.events;

CREATE POLICY "Users can crud own events"
ON public.events FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Assistant Access: View events where they are assigned OR belong to their parent_user (Organization)
CREATE POLICY "Assistants can view assigned events"
ON public.events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_assistants ea
    JOIN assistants a ON a.id = ea.assistant_id
    WHERE a.assistant_user_id = auth.uid() AND ea.event_id = events.id
  )
  OR
  user_id IN (
    SELECT parent_user_id FROM public.profiles WHERE id = auth.uid() AND parent_user_id IS NOT NULL
  )
);

-- Admin Access
CREATE POLICY "Admins can view all events"
ON public.events FOR SELECT
USING ((select role from public.profiles where id = auth.uid()) = 'admin');


-- 4. Contracts Policies
DROP POLICY IF EXISTS "Users can crud own contracts" ON public.contracts;

CREATE POLICY "Users can crud own contracts"
ON public.contracts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Transactions Policies
DROP POLICY IF EXISTS "Users can crud own transactions" ON public.transactions;

CREATE POLICY "Users can crud own transactions"
ON public.transactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. User Integrations Policies (Reinforce)
DROP POLICY IF EXISTS "Users can crud own integrations" ON public.user_integrations;

CREATE POLICY "Users can crud own integrations"
ON public.user_integrations FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. Fix Profiles Role Default (Audit)
-- Ensure newly created profiles have a default role if not set (optional, but good for safety)
-- ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'professional';
