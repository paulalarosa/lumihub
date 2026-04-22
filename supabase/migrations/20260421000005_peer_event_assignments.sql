-- Rodada 3: atribuição de peer em evento específico.
--
-- Fluxo: host (A) já tem peer_connection aceita com B. Ao criar/editar um
-- evento, A pode "chamar" B como reforço daquele evento específico. B vê
-- no dashboard dela uma aba "Meus reforços" com data/hora/local/fee — mas
-- NUNCA vê client_id, nome da noiva, valor total do evento, notas internas,
-- contratos, faturas.
--
-- Segurança em camadas:
--   1. RLS na própria tabela peer_event_assignments (host ou peer veem)
--   2. Peer NUNCA faz select direto no events — usa RPC que retorna só
--      os campos seguros.
--   3. Trigger valida na hora do INSERT que os dois usuários têm
--      peer_connection com status='accepted'. Sem isso, insert falha.

BEGIN;

CREATE TABLE public.peer_event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  host_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  peer_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agreed_fee numeric(10,2) NOT NULL DEFAULT 0 CHECK (agreed_fee >= 0),
  status text NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'accepted', 'declined', 'cancelled', 'done')),
  -- Nota que o host deixa pra peer. É O ÚNICO texto livre que a peer vê —
  -- o host precisa saber que não pode colocar info sensível da noiva aqui.
  notes text,
  -- Estrutura pronta pra fee de plataforma, zerada por enquanto (decisão
  -- produto: ligar depois com system_config).
  platform_fee_percent numeric(5,2) DEFAULT 0,
  platform_fee_amount numeric(10,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (event_id, peer_user_id),
  CHECK (host_user_id <> peer_user_id)
);

-- Indexes pros lookups frequentes
CREATE INDEX idx_peer_assignments_peer ON public.peer_event_assignments(peer_user_id, status);
CREATE INDEX idx_peer_assignments_event ON public.peer_event_assignments(event_id);
CREATE INDEX idx_peer_assignments_host ON public.peer_event_assignments(host_user_id, created_at DESC);

-- RLS: cada lado vê só as próprias rows
ALTER TABLE public.peer_event_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY pea_select_involved ON public.peer_event_assignments
  FOR SELECT TO authenticated
  USING (host_user_id = auth.uid() OR peer_user_id = auth.uid());

-- INSERT só o host, e o status obrigatoriamente começa como 'invited'.
CREATE POLICY pea_insert_host ON public.peer_event_assignments
  FOR INSERT TO authenticated
  WITH CHECK (host_user_id = auth.uid() AND status = 'invited');

-- UPDATE: peer pode aceitar/recusar. Host pode cancelar ou marcar como done.
-- Separei em duas policies pra enforcar os estados permitidos por papel.
CREATE POLICY pea_update_peer_response ON public.peer_event_assignments
  FOR UPDATE TO authenticated
  USING (peer_user_id = auth.uid())
  WITH CHECK (peer_user_id = auth.uid() AND status IN ('accepted', 'declined'));

CREATE POLICY pea_update_host_flow ON public.peer_event_assignments
  FOR UPDATE TO authenticated
  USING (host_user_id = auth.uid())
  WITH CHECK (host_user_id = auth.uid() AND status IN ('cancelled', 'done', 'invited'));

-- DELETE só o host (em geral preferir UPDATE status='cancelled', mas útil
-- pra limpar ruído de teste).
CREATE POLICY pea_delete_host ON public.peer_event_assignments
  FOR DELETE TO authenticated
  USING (host_user_id = auth.uid());

-- Admin bypass
CREATE POLICY pea_admin_select ON public.peer_event_assignments
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Trigger de validação: só permite INSERT se existe peer_connection
-- accepted entre host e peer. Sem conexão, não dá pra convidar.
CREATE OR REPLACE FUNCTION public.peer_event_assignments_validate_connection()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.peer_connections pc
    WHERE pc.status = 'accepted'
      AND (
        (pc.host_user_id = NEW.host_user_id AND pc.peer_user_id = NEW.peer_user_id)
        OR
        (pc.host_user_id = NEW.peer_user_id AND pc.peer_user_id = NEW.host_user_id)
      )
  ) THEN
    RAISE EXCEPTION 'Host and peer must have an accepted peer_connection before assigning an event'
      USING HINT = 'Convide e aceite na tela /rede primeiro.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pea_validate_connection
  BEFORE INSERT ON public.peer_event_assignments
  FOR EACH ROW EXECUTE FUNCTION public.peer_event_assignments_validate_connection();

-- Auto-timestamp quando status sai de invited
CREATE OR REPLACE FUNCTION public.peer_event_assignments_set_responded_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'invited' AND NEW.status IN ('accepted', 'declined', 'cancelled') THEN
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pea_responded_at
  BEFORE UPDATE ON public.peer_event_assignments
  FOR EACH ROW EXECUTE FUNCTION public.peer_event_assignments_set_responded_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.peer_event_assignments;

-- RPC peer-safe: a peer chama isso pra listar seus assignments sem
-- jamais fazer select direto em events/wedding_clients. Retorna SÓ os
-- campos que a peer pode ver. Nome da noiva, contrato, fatura — nada
-- disso escapa.
CREATE OR REPLACE FUNCTION public.get_my_peer_assignments(
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  status text,
  agreed_fee numeric,
  notes text,
  created_at timestamptz,
  responded_at timestamptz,
  event_type text,
  event_date date,
  start_time text,
  end_time text,
  location text,
  address text,
  host_user_id uuid,
  host_full_name text,
  host_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pea.id,
    pea.event_id,
    pea.status,
    pea.agreed_fee,
    pea.notes,
    pea.created_at,
    pea.responded_at,
    e.event_type,
    e.event_date,
    e.start_time,
    e.end_time,
    e.location,
    e.address,
    pea.host_user_id,
    p.full_name,
    p.email
  FROM public.peer_event_assignments pea
  JOIN public.events e ON e.id = pea.event_id
  JOIN public.profiles p ON p.id = pea.host_user_id
  WHERE pea.peer_user_id = auth.uid()
    AND (p_status IS NULL OR pea.status = p_status)
  ORDER BY e.event_date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_peer_assignments(text) TO authenticated;

COMMIT;
