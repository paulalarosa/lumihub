-- Rodada B2: expor contato da maquiadora na payload do portal da noiva
-- pra feature de botão WhatsApp direto.
--
-- Adiciona `makeup_artist` object ao retorno de get_bride_portal:
--   { full_name, phone, whatsapp } — SÓ esses campos. Email, business,
-- endereço, etc ficam de fora (noiva não precisa e é info pessoal).

BEGIN;

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
  v_makeup_artist jsonb;
  v_host_user_id uuid;
BEGIN
  IF p_token IS NULL OR trim(p_token) = '' THEN
    RETURN jsonb_build_object('error', 'token_missing');
  END IF;

  v_hash := encode(digest(p_token, 'sha256'), 'hex');

  SELECT bat.client_id INTO v_client_id
  FROM public.bride_access_tokens bat
  WHERE bat.token_hash = v_hash
    AND bat.is_revoked = false
    AND bat.expires_at > now();

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('error', 'token_invalid');
  END IF;

  BEGIN
    UPDATE public.bride_access_tokens
    SET last_used_at = now()
    WHERE token_hash = v_hash;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Dono da cliente (a maquiadora). Esse user_id vai virar o "contato"
  -- visível pra noiva.
  SELECT user_id INTO v_host_user_id
  FROM public.wedding_clients
  WHERE id = v_client_id;

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

  -- Contato da maquiadora (campos mínimos pra UX de "fale com"):
  -- nome público + telefone. Email NÃO vai pra noiva.
  SELECT jsonb_build_object(
    'full_name', COALESCE(p.full_name, 'Sua maquiadora'),
    'phone', p.phone,
    'whatsapp', p.phone
  ) INTO v_makeup_artist
  FROM public.profiles p
  WHERE p.id = v_host_user_id;

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
    'is_fully_paid', (v_total_paid >= v_total_contract AND v_total_contract > 0),
    'makeup_artist', v_makeup_artist
  );
END;
$$;

COMMIT;
