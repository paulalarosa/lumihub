-- Fix: send_invoice_email estava chamando edge function inexistente `send-ses-email`
-- com payload incompatível. Reescreve para usar `send-invoice-email` (que existe
-- e está deployed) via invoke_edge_function helper, mapeando o payload pra shape
-- { to, variant, invoice_number, amount, client_name, due_date?, paid_at?, user_id }.
--
-- Sem isso, toda criação/pagamento de fatura silenciosamente falhava no email
-- (EXCEPTION WHEN OTHERS THEN NULL engolia o erro).

BEGIN;

CREATE OR REPLACE FUNCTION public.send_invoice_email(
  p_user_id uuid,
  p_template text,
  p_template_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_owner_email text;
  v_variant text;
  v_body jsonb;
BEGIN
  SELECT email INTO v_owner_email
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_owner_email IS NULL OR v_owner_email = '' THEN
    RETURN;
  END IF;

  v_variant := CASE
    WHEN p_template = 'khk_invoice_created' THEN 'created'
    WHEN p_template = 'khk_invoice_paid'    THEN 'paid'
    ELSE NULL
  END;

  IF v_variant IS NULL THEN
    RAISE NOTICE 'send_invoice_email: unknown template %', p_template;
    RETURN;
  END IF;

  v_body := jsonb_build_object(
    'to', v_owner_email,
    'variant', v_variant,
    'user_id', p_user_id,
    'invoice_number', p_template_data->>'invoice_number',
    'amount', p_template_data->>'amount',
    'client_name', p_template_data->>'client_name'
  );

  IF v_variant = 'created' THEN
    v_body := v_body || jsonb_build_object('due_date', p_template_data->>'due_date');
  ELSE
    v_body := v_body || jsonb_build_object('paid_at', p_template_data->>'paid_at');
  END IF;

  PERFORM public.invoke_edge_function('send-invoice-email', v_body);

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'send_invoice_email failed: %', SQLERRM;
END;
$$;

COMMIT;
