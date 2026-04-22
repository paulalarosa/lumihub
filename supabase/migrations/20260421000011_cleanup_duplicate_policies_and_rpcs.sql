-- Cleanup: policies RLS duplicadas + RPC obsoleta.
--
-- Contexto: auditoria de saúde do schema identificou
--   - Tabelas com 2-4 policies ALL com predicado idêntico (ruído, risco de
--     divergência futura quando alguém editar 1 e esquecer de replicar).
--   - `get_bride_dashboard_data` substituído por `get_bride_portal`
--     (20260421000007), ninguém mais chama.
--
-- Regra de dedup: manter a policy com predicado `is_admin()` ou
-- `auth.uid() = user_id` canônico. Dropar as variantes inline ou com
-- casts desnecessários.

BEGIN;

-- transactions: 4 policies ALL → 2 canônicas
DROP POLICY IF EXISTS "Transactions admin full" ON public.transactions;
-- Mantém "Admins can manage all transactions" (is_admin())
DROP POLICY IF EXISTS "Transactions owners" ON public.transactions;
-- Mantém "Users can manage own transactions" (auth.uid() = user_id)
DROP POLICY IF EXISTS "Users view own transactions" ON public.transactions;
-- A policy acima filtrava via project_id; o owner check já cobre o mesmo caso.

-- services: 3 policies ALL → 2 canônicas
DROP POLICY IF EXISTS "Services admin full" ON public.services;
-- Mantém uma policy ALL owner. Precisa de SELECT admin bypass.
DROP POLICY IF EXISTS "Services owners" ON public.services;
-- Mantém "Users can manage own services"

-- Readiciona admin bypass limpo em services (is_admin())
CREATE POLICY "services_admin_select" ON public.services
  FOR SELECT TO authenticated USING (public.is_admin());

-- wedding_clients: 2 policies ALL idênticas
DROP POLICY IF EXISTS "Users manage own wedding_clients" ON public.wedding_clients;
-- Mantém "Users manage own clients"

-- user_ai_settings: 2 policies ALL idênticas
DROP POLICY IF EXISTS "Users can manage their own AI settings" ON public.user_ai_settings;
-- Mantém "Users can manage own ai settings"

-- user_integrations: 2 policies ALL com cast redundante
DROP POLICY IF EXISTS "Users manage own integrations" ON public.user_integrations;
-- Mantém "Users can manage own integrations"

-- system_config: 2 policies ALL (inline vs is_admin) — canônico é is_admin()
DROP POLICY IF EXISTS "Admins can manage system config" ON public.system_config;
-- Mantém "System config admin"

-- RPC obsoleta: portal da noiva agora usa get_bride_portal (20260421000007).
DROP FUNCTION IF EXISTS public.get_bride_dashboard_data(uuid);
DROP FUNCTION IF EXISTS public.get_bride_dashboard_data(uuid, text);

COMMIT;
