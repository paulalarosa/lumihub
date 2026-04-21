-- Admin analytics: `client_sources` puxava de `analytics_logs` (event_type=signup)
-- que está vazia em prod — nunca foi populada por trigger ou write explícito.
-- Mudar pra `wedding_clients.origin`, que agora é preenchido pelo ClientForm
-- com enum {instagram, indicacao, site, google, outro}.
--
-- Rows com origin NULL são agrupadas como 'Não informado' pra não sumirem.

CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_total_events integer;
  v_events_by_category jsonb;
  v_monthly_revenue jsonb;
  v_client_sources jsonb;
  v_page_views jsonb;
  v_current_month_revenue numeric;
  v_previous_month_revenue numeric;
  v_total_clients integer;
  v_new_clients_month integer;
  v_conversion_rate numeric;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  SELECT count(*) INTO v_total_events
  FROM events
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

  SELECT count(*) INTO v_total_clients FROM wedding_clients;

  SELECT count(*) INTO v_new_clients_month
  FROM wedding_clients
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

  SELECT COALESCE(sum(net_amount), 0) INTO v_current_month_revenue
  FROM transactions
  WHERE status = 'completed'
  AND created_at >= date_trunc('month', CURRENT_DATE);

  SELECT COALESCE(sum(net_amount), 0) INTO v_previous_month_revenue
  FROM transactions
  WHERE status = 'completed'
  AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
  AND created_at < date_trunc('month', CURRENT_DATE);

  WITH active AS (
    SELECT count(*) AS cnt FROM profiles WHERE subscription_status = 'active' AND role != 'admin'
  ),
  total AS (
    SELECT count(*) AS cnt FROM profiles WHERE role != 'admin'
  )
  SELECT
    CASE WHEN t.cnt = 0 THEN 0
    ELSE ROUND((a.cnt::numeric / t.cnt) * 100, 1)
    END INTO v_conversion_rate
  FROM active a, total t;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', cat, 'value', cnt)), '[]'::jsonb)
  INTO v_events_by_category
  FROM (
    SELECT COALESCE(type, 'other') AS cat, count(*) AS cnt
    FROM analytics_logs
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY COALESCE(type, 'other')
    ORDER BY cnt DESC
    LIMIT 10
  ) sub;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', m, 'value', rev)), '[]'::jsonb)
  INTO v_monthly_revenue
  FROM (
    SELECT
      to_char(date_trunc('month', created_at), 'MM/YY') AS m,
      COALESCE(sum(net_amount), 0) AS rev
    FROM transactions
    WHERE status = 'completed'
    AND created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at)
  ) sub;

  -- Origem dos clientes: agrega `wedding_clients.origin` dos últimos 180 dias.
  -- Labels humanas são traduzidas inline (o enum no banco é minúsculo).
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', src, 'value', cnt)), '[]'::jsonb)
  INTO v_client_sources
  FROM (
    SELECT
      CASE COALESCE(origin, 'nao_informado')
        WHEN 'instagram' THEN 'Instagram'
        WHEN 'indicacao' THEN 'Indicação'
        WHEN 'site' THEN 'Site'
        WHEN 'google' THEN 'Google'
        WHEN 'outro' THEN 'Outro'
        ELSE 'Não informado'
      END AS src,
      count(*) AS cnt
    FROM wedding_clients
    WHERE created_at >= CURRENT_DATE - INTERVAL '180 days'
    GROUP BY COALESCE(origin, 'nao_informado')
    ORDER BY cnt DESC
    LIMIT 6
  ) sub;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', pg, 'value', cnt)), '[]'::jsonb)
  INTO v_page_views
  FROM (
    SELECT COALESCE(metadata->>'page_path', '/') AS pg, count(*) AS cnt
    FROM analytics_logs
    WHERE event_type = 'page_view'
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY COALESCE(metadata->>'page_path', '/')
    ORDER BY cnt DESC
    LIMIT 10
  ) sub;

  result := jsonb_build_object(
    'total_events', v_total_events,
    'total_clients', v_total_clients,
    'new_clients_month', v_new_clients_month,
    'monthly_revenue', v_current_month_revenue,
    'previous_month_revenue', v_previous_month_revenue,
    'conversion_rate', v_conversion_rate,
    'growth_revenue_percentage', CASE
      WHEN v_previous_month_revenue = 0 THEN 0
      ELSE ROUND(((v_current_month_revenue - v_previous_month_revenue) / v_previous_month_revenue) * 100, 1)
    END,
    'growth_client_percentage', CASE
      WHEN v_total_clients = 0 THEN 0
      ELSE ROUND((v_new_clients_month::numeric / v_total_clients) * 100, 1)
    END,
    'events_by_category', v_events_by_category,
    'revenue_chart', v_monthly_revenue,
    'client_sources', v_client_sources,
    'page_views', v_page_views
  );

  RETURN result;
END;
$$;
