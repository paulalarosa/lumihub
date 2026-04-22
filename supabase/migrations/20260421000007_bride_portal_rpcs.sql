-- Portal da noiva: consolida o acesso anon via 2 RPCs SECURITY DEFINER que
-- cobrem o fluxo inteiro. Substitui o combo quebrado
-- `validate_bride_pin` + `generate_bride_token` (o segundo exigia
-- `auth.uid()` do dono da cliente — impossível pra noiva anon).
--
-- Decisão produto (Paula, 2026-04-21): acesso é PIN-only, sem login Supabase.
-- Logo, o fluxo TODO precisa funcionar anon-callable.
--
-- Peer safety: estes RPCs são a fronteira. Eles retornam APENAS colunas
-- seguras do evento. Nada de `peer_event_assignments`, nada de outros
-- clientes da maquiadora, nada de contratos de outras noivas.

BEGIN;

-- 1. bride_login: valida PIN e gera token em uma operação atômica. Rejeita
-- brute force por cooldown (coluna em wedding_clients será adicionada na
-- Rodada C). Por enquanto só faz o check simples + invalida tokens
-- antigos da mesma cliente.
CREATE OR REPLACE FUNCTION public.bride_login(
  p_client_id uuid,
  p_pin_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_client RECORD;
  v_token text;
  v_hash text;
BEGIN
  IF p_client_id IS NULL OR p_pin_code IS NULL OR trim(p_pin_code) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dados inválidos');
  END IF;

  SELECT id, name, full_name, email
  INTO v_client
  FROM public.wedding_clients
  WHERE id = p_client_id
    AND access_pin = trim(p_pin_code);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIN inválido');
  END IF;

  -- Invalida tokens anteriores da mesma cliente (um device ativo por vez).
  UPDATE public.bride_access_tokens
  SET is_revoked = true
  WHERE client_id = v_client.id AND is_revoked = false;

  -- Novo token: 32 bytes aleatórios em hex. Hash SHA-256 é guardado no DB;
  -- só o plain_token vai pro cliente.
  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  INSERT INTO public.bride_access_tokens (
    client_id, token_hash, plain_token, expires_at
  ) VALUES (
    v_client.id, v_hash, v_token, now() + interval '30 days'
  );

  RETURN jsonb_build_object(
    'success', true,
    'token', v_token,
    'client_id', v_client.id,
    'client_name', COALESCE(v_client.full_name, v_client.name),
    'client_email', v_client.email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.bride_login(uuid, text) TO anon, authenticated;

-- 2. get_bride_portal: retorna TUDO que o dashboard precisa em uma chamada.
-- Recebe o token, valida internamente, retorna shape consistente.
-- Shape desenhado pra casar com o que a UI atual exibe — evita N queries
-- SELECT direto que hoje falham por RLS (a noiva é anon, RLS bloqueia).
CREATE OR REPLACE FUNCTION public.get_bride_portal(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
  v_client_id uuid;
  v_client jsonb;
  v_project jsonb;
  v_services jsonb;
  v_contracts jsonb;
  v_events jsonb;
  v_transactions jsonb;
  v_total_contract numeric;
  v_total_paid numeric;
  v_project_id uuid;
BEGIN
  IF p_token IS NULL OR trim(p_token) = '' THEN
    RETURN jsonb_build_object('error', 'token_missing');
  END IF;

  -- Valida token (não-revogado, não-expirado)
  v_hash := encode(digest(p_token, 'sha256'), 'hex');

  SELECT bat.client_id INTO v_client_id
  FROM public.bride_access_tokens bat
  WHERE bat.token_hash = v_hash
    AND bat.is_revoked = false
    AND bat.expires_at > now();

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'token_invalid');
  END IF;

  -- Last-used timestamp (não trava se falhar)
  BEGIN
    UPDATE public.bride_access_tokens
    SET last_used_at = now()
    WHERE token_hash = v_hash;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Client payload (só campos seguros)
  SELECT jsonb_build_object(
    'id', id,
    'name', COALESCE(full_name, name),
    'full_name', full_name,
    'email', email,
    'phone', phone,
    'wedding_date', wedding_date,
    'portal_link', portal_link
  ) INTO v_client
  FROM public.wedding_clients
  WHERE id = v_client_id;

  -- Project principal da cliente (assume 1:1 client↔project, escolhe o
  -- mais recente se houver múltiplos)
  SELECT id INTO v_project_id
  FROM public.projects
  WHERE client_id = v_client_id
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'status', p.status,
    'event_date', p.event_date,
    'event_time', p.event_time,
    'event_location', p.event_location,
    'notes', p.notes,
    'total_value', p.total_value,
    'created_at', p.created_at
  ) INTO v_project
  FROM public.projects p
  WHERE p.id = v_project_id;

  -- Services com nome resolvido
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ps.id,
      'name', COALESCE(s.name, 'Serviço'),
      'quantity', ps.quantity,
      'unit_price', ps.unit_price,
      'line_total', (COALESCE(ps.unit_price, 0) * COALESCE(ps.quantity, 1))
    )
  ), '[]'::jsonb) INTO v_services
  FROM public.project_services ps
  LEFT JOIN public.services s ON s.id = ps.service_id
  WHERE ps.project_id = v_project_id;

  -- Contracts
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'title', c.title,
      'content', c.content,
      'status', c.status,
      'signed_at', c.signed_at,
      'signature_url', c.signature_url,
      'attachment_url', c.attachment_url,
      'project_id', c.project_id,
      'client_id', c.client_id,
      'created_at', c.created_at
    )
  ), '[]'::jsonb) INTO v_contracts
  FROM public.contracts c
  WHERE c.project_id = v_project_id OR c.client_id = v_client_id;

  -- Events peer-safe: NUNCA join com peer_event_assignments. Só as colunas
  -- que a maquiadora controla diretamente no evento.
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'description', e.description,
      'event_type', e.event_type,
      'event_date', e.event_date,
      'start_time', e.start_time,
      'end_time', e.end_time,
      'arrival_time', e.arrival_time,
      'making_of_time', e.making_of_time,
      'ceremony_time', e.ceremony_time,
      'location', e.location,
      'address', e.address,
      'color', e.color
    )
    ORDER BY e.event_date, e.start_time
  ), '[]'::jsonb) INTO v_events
  FROM public.events e
  WHERE e.client_id = v_client_id;

  -- Transactions (só income types relevantes pra noiva) + agregados
  SELECT
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'amount', t.amount,
        'date', t.date,
        'payment_method', t.payment_method,
        'category', t.category,
        'description', t.description
      ) ORDER BY t.date DESC
    ), '[]'::jsonb),
    COALESCE(SUM(
      CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END
    ), 0)
  INTO v_transactions, v_total_paid
  FROM public.transactions t
  WHERE t.project_id = v_project_id;

  -- Total do contrato: soma dos services
  SELECT COALESCE(SUM(
    COALESCE(unit_price, 0) * COALESCE(quantity, 1)
  ), 0) INTO v_total_contract
  FROM public.project_services
  WHERE project_id = v_project_id;

  RETURN jsonb_build_object(
    'client', v_client,
    'project', v_project,
    'services', v_services,
    'contracts', v_contracts,
    'events', v_events,
    'transactions', v_transactions,
    'total_contract', v_total_contract,
    'total_paid', v_total_paid,
    'is_fully_paid', (v_total_paid >= v_total_contract AND v_total_contract > 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_bride_portal(text) TO anon, authenticated;

COMMIT;
