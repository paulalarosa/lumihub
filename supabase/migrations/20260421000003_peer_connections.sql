-- Peer connections: maquiadora A convida maquiadora B (ambas com conta)
-- pra virarem parceiras. Depois de aceita, A pode chamar B como reforço
-- em eventos específicos via `peer_event_assignments` (rodada 2).
--
-- Esta migration cobre SÓ o relacionamento de confiança. Nada de eventos,
-- nada de fee. Só o handshake.
--
-- Decisão produto (Paula, 2026-04-21):
--   - Email é a chave universal (normalizado lowercase)
--   - Sem fee de plataforma por enquanto (estrutura pronta pra depois)
--   - Sem rating/bloqueio no MVP
--   - Convite direto (sem descoberta pública)

BEGIN;

CREATE TABLE public.peer_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  peer_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Email usado pra convidar, normalizado lowercase. Redundante com
  -- peer_user_id, mas útil pra auditoria e pra casar com o trigger de
  -- transição assistente→usuária (rodada 2).
  invited_email text NOT NULL CHECK (invited_email = lower(invited_email)),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  -- Mensagem opcional no momento do convite. Ex: "bora fechar sábado?"
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  -- Uma conexão POR DIREÇÃO. A→B e B→A são linhas distintas. Se A convida
  -- B e depois B convida A, ambas são válidas e viram 2 relações simétricas.
  UNIQUE (host_user_id, peer_user_id),
  -- Não pode convidar a si mesma.
  CHECK (host_user_id <> peer_user_id)
);

-- Lookups frequentes: "me mostra todas as minhas conexões" (host OU peer)
CREATE INDEX idx_peer_conn_host ON public.peer_connections(host_user_id)
  WHERE status = 'accepted';
CREATE INDEX idx_peer_conn_peer ON public.peer_connections(peer_user_id)
  WHERE status = 'accepted';
-- "Convites pendentes pra mim"
CREATE INDEX idx_peer_conn_pending_peer ON public.peer_connections(peer_user_id)
  WHERE status = 'pending';
CREATE INDEX idx_peer_conn_email ON public.peer_connections(invited_email);

-- RLS: rígido. Cada usuária vê APENAS suas próprias conexões.
ALTER TABLE public.peer_connections ENABLE ROW LEVEL SECURITY;

-- SELECT: host OU peer conseguem ler a própria linha.
CREATE POLICY peer_conn_select_own
  ON public.peer_connections FOR SELECT TO authenticated
  USING (host_user_id = auth.uid() OR peer_user_id = auth.uid());

-- INSERT: só o host pode criar convite. Status forçado 'pending'.
CREATE POLICY peer_conn_insert_as_host
  ON public.peer_connections FOR INSERT TO authenticated
  WITH CHECK (host_user_id = auth.uid() AND status = 'pending');

-- UPDATE: peer pode mudar pra accepted/declined. Host pode deletar (cancelar
-- convite) mas não editar status (evita "host reverte aceite da peer").
CREATE POLICY peer_conn_update_as_peer
  ON public.peer_connections FOR UPDATE TO authenticated
  USING (peer_user_id = auth.uid())
  WITH CHECK (peer_user_id = auth.uid() AND status IN ('accepted', 'declined'));

-- DELETE: host pode cancelar convite pendente; peer pode remover aceito.
-- Ambos lados têm a saída.
CREATE POLICY peer_conn_delete_own
  ON public.peer_connections FOR DELETE TO authenticated
  USING (host_user_id = auth.uid() OR peer_user_id = auth.uid());

-- Admin bypass (consistente com outras tabelas do sistema)
CREATE POLICY peer_conn_admin_all
  ON public.peer_connections FOR SELECT TO authenticated
  USING (public.is_admin());

-- Trigger: responded_at preenchido automaticamente quando status sai de
-- 'pending'. Evita que o cliente esqueça de setar.
CREATE OR REPLACE FUNCTION public.peer_connections_set_responded_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined') THEN
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_peer_conn_responded_at
  BEFORE UPDATE ON public.peer_connections
  FOR EACH ROW EXECUTE FUNCTION public.peer_connections_set_responded_at();

-- Normalizer: garante que invited_email entra sempre lowercase mesmo que
-- o cliente esqueça. Defense in depth além do CHECK.
CREATE OR REPLACE FUNCTION public.peer_connections_normalize_email()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.invited_email := lower(trim(NEW.invited_email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_peer_conn_normalize_email
  BEFORE INSERT OR UPDATE OF invited_email ON public.peer_connections
  FOR EACH ROW EXECUTE FUNCTION public.peer_connections_normalize_email();

-- Realtime publication (padrão do projeto: 21+ tabelas já publicadas).
ALTER PUBLICATION supabase_realtime ADD TABLE public.peer_connections;

COMMIT;
