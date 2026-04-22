-- Rodada 2 da refatoração de assistentes/peers:
--
-- 1) Muda PIN de `assistants.access_pin` (singular, global) pra
--    `assistant_access.pin` (por par maquiadora↔assistente). Resolve o bug
--    multi-tenant: se a mesma assistente é chamada por A e B, cada par tem
--    seu próprio PIN.
--
-- 2) Corrige bug de segurança na RPC `verify_assistant_login` — hoje ela
--    NÃO filtra por `p_professional_id`, então qualquer PIN autentica
--    contra qualquer maquiadora (cross-tenant leak). Nova versão filtra
--    via `assistant_access.makeup_artist_id`.
--
-- 3) Trigger `handle_new_profile_pending_peer_migrations`: quando uma
--    pessoa que já era assistente-PIN se cadastra como usuária, o sistema
--    registra os vínculos em `pending_peer_migrations` pra a usuária
--    decidir no onboarding se quer migrar pra `peer_connections`.
--
-- Estado dos dados em prod (2026-04-21): 3 assistentes com PIN, 0 com
-- user_id. Migração backfilla os 3 PINs pra `assistant_access.pin`.

BEGIN;

-- 1. Expandir assistant_access
ALTER TABLE public.assistant_access
  ADD COLUMN IF NOT EXISTS pin text,
  ADD COLUMN IF NOT EXISTS default_fee numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upgraded_at timestamptz;

-- Backfill: copia o PIN existente em assistants.access_pin (ou assistants.pin
-- como fallback) pra todas as rows de assistant_access. Dual-write continua
-- durante algumas semanas até podermos dropar as colunas antigas.
UPDATE public.assistant_access aa
SET pin = COALESCE(a.access_pin, a.pin)
FROM public.assistants a
WHERE aa.assistant_id = a.id
  AND aa.pin IS NULL
  AND COALESCE(a.access_pin, a.pin) IS NOT NULL;

-- 2. Tabela de migrações pendentes: quando alguém faz signup e já era
--    assistente-PIN, cria rows aqui pra UI oferecer migração assistida.
CREATE TABLE IF NOT EXISTS public.pending_peer_migrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assistant_access_id uuid NOT NULL REFERENCES public.assistant_access(id) ON DELETE CASCADE,
  host_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assistant_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (profile_id, assistant_access_id)
);

ALTER TABLE public.pending_peer_migrations ENABLE ROW LEVEL SECURITY;

-- Usuária vê só suas próprias migrações pendentes
CREATE POLICY ppm_select_own ON public.pending_peer_migrations
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- Usuária pode deletar (descartar) suas pendências manualmente
CREATE POLICY ppm_delete_own ON public.pending_peer_migrations
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- Admin bypass
CREATE POLICY ppm_admin_select ON public.pending_peer_migrations
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Realtime: onboarding precisa saber se a lista cresceu
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_peer_migrations;

-- 3. Trigger que popula pending_peer_migrations quando um profile novo
-- tem email que bate com assistentes existentes.
CREATE OR REPLACE FUNCTION public.handle_new_profile_pending_peer_migrations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_host_user_id uuid;
BEGIN
  -- Sem email, nada a fazer
  IF NEW.email IS NULL OR trim(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  -- Para cada assistant_access ativa cujo email da assistente bate com o
  -- email do novo profile, cria uma migração pendente.
  FOR v_match IN
    SELECT aa.id AS access_id, aa.makeup_artist_id, a.id AS assistant_id
    FROM public.assistants a
    JOIN public.assistant_access aa ON aa.assistant_id = a.id
    WHERE lower(a.email) = lower(NEW.email)
      AND aa.status = 'active'
  LOOP
    SELECT user_id INTO v_host_user_id
    FROM public.makeup_artists
    WHERE id = v_match.makeup_artist_id;

    IF v_host_user_id IS NOT NULL AND v_host_user_id <> NEW.id THEN
      INSERT INTO public.pending_peer_migrations (
        profile_id,
        assistant_access_id,
        host_user_id,
        assistant_email
      )
      VALUES (
        NEW.id,
        v_match.access_id,
        v_host_user_id,
        lower(NEW.email)
      )
      ON CONFLICT (profile_id, assistant_access_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Vincula user_id nos registros de assistants com email igual (a pessoa
  -- agora tem conta — assistants.user_id passa a apontar pro profile). Isso
  -- permite, a partir daqui, a pessoa fazer login normal via auth E
  -- continuar como assistente-PIN em paralelo até decidir migrar via UI.
  UPDATE public.assistants
  SET user_id = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND user_id IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_pending_peer_migrations ON public.profiles;
CREATE TRIGGER trg_profile_pending_peer_migrations
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_pending_peer_migrations();

-- 4. RPC verify_assistant_login: corrige bug de segurança + le novo schema.
-- Agora filtra por makeup_artist_id (via assistant_access) + prioriza
-- PIN em assistant_access.pin, com fallback pra assistants.pin durante a
-- transição.
CREATE OR REPLACE FUNCTION public.verify_assistant_login(
  p_professional_id uuid,
  p_pin text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_id uuid;
  v_assistant RECORD;
BEGIN
  p_pin := TRIM(p_pin);

  IF p_pin IS NULL OR p_pin = '' OR p_professional_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Resolve o makeup_artists.id da maquiadora alvo (p_professional_id é
  -- profiles.id, aka user_id).
  SELECT id INTO v_artist_id
  FROM public.makeup_artists
  WHERE user_id = p_professional_id;

  IF v_artist_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Prioridade 1: PIN em assistant_access (novo schema, por par).
  SELECT a.id, a.full_name, aa.id AS access_id
  INTO v_assistant
  FROM public.assistant_access aa
  JOIN public.assistants a ON a.id = aa.assistant_id
  WHERE aa.makeup_artist_id = v_artist_id
    AND aa.status = 'active'
    AND aa.pin = p_pin
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'id', v_assistant.id,
      'full_name', v_assistant.full_name,
      'access_id', v_assistant.access_id
    );
  END IF;

  -- Prioridade 2 (fallback transição): PIN em assistants.access_pin/pin
  -- mas só aceita se existe assistant_access ativo entre a assistente e
  -- esse makeup_artist. Fecha o bug de cross-tenant mesmo no caminho legado.
  SELECT a.id, a.full_name, aa.id AS access_id
  INTO v_assistant
  FROM public.assistants a
  JOIN public.assistant_access aa ON aa.assistant_id = a.id
  WHERE aa.makeup_artist_id = v_artist_id
    AND aa.status = 'active'
    AND (a.pin = p_pin OR a.access_pin = p_pin)
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'id', v_assistant.id,
      'full_name', v_assistant.full_name,
      'access_id', v_assistant.access_id
    );
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_assistant_login(uuid, text) TO anon, authenticated;

COMMIT;
