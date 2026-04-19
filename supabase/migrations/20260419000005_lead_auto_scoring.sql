-- Automatic lead scoring. Computes a 0-100 score from available signals and
-- stores the breakdown in score_factors for transparency.

BEGIN;

CREATE OR REPLACE FUNCTION public.compute_lead_score(
  p_email text,
  p_phone text,
  p_event_date date,
  p_estimated_budget numeric,
  p_source text,
  p_status text,
  p_name text,
  p_client_name text,
  p_notes text
) RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_score integer := 0;
  v_factors jsonb := '{}'::jsonb;
  v_days_to_event integer;
BEGIN
  IF p_email IS NOT NULL AND length(trim(p_email)) > 0 THEN
    v_score := v_score + 10;
    v_factors := v_factors || jsonb_build_object('email', 10);
  END IF;

  IF p_phone IS NOT NULL AND length(trim(p_phone)) > 0 THEN
    v_score := v_score + 10;
    v_factors := v_factors || jsonb_build_object('phone', 10);
  END IF;

  IF p_event_date IS NOT NULL THEN
    v_days_to_event := p_event_date - CURRENT_DATE;
    IF v_days_to_event BETWEEN 0 AND 90 THEN
      v_score := v_score + 25;
      v_factors := v_factors || jsonb_build_object('event_date_urgent', 25);
    ELSIF v_days_to_event BETWEEN 91 AND 365 THEN
      v_score := v_score + 15;
      v_factors := v_factors || jsonb_build_object('event_date_known', 15);
    ELSIF v_days_to_event > 365 THEN
      v_score := v_score + 5;
      v_factors := v_factors || jsonb_build_object('event_date_far', 5);
    END IF;
  END IF;

  IF p_estimated_budget IS NOT NULL THEN
    IF p_estimated_budget >= 5000 THEN
      v_score := v_score + 25;
      v_factors := v_factors || jsonb_build_object('budget_premium', 25);
    ELSIF p_estimated_budget >= 2000 THEN
      v_score := v_score + 15;
      v_factors := v_factors || jsonb_build_object('budget_mid', 15);
    ELSIF p_estimated_budget > 0 THEN
      v_score := v_score + 5;
      v_factors := v_factors || jsonb_build_object('budget_entry', 5);
    END IF;
  END IF;

  IF p_source IS NOT NULL THEN
    IF p_source ILIKE 'referral%' OR p_source ILIKE 'indicac%' THEN
      v_score := v_score + 15;
      v_factors := v_factors || jsonb_build_object('source_referral', 15);
    ELSIF p_source ILIKE 'website' OR p_source ILIKE 'site' THEN
      v_score := v_score + 10;
      v_factors := v_factors || jsonb_build_object('source_website', 10);
    ELSIF p_source ILIKE 'instagram%' THEN
      v_score := v_score + 7;
      v_factors := v_factors || jsonb_build_object('source_instagram', 7);
    ELSE
      v_score := v_score + 3;
      v_factors := v_factors || jsonb_build_object('source_other', 3);
    END IF;
  END IF;

  IF p_notes IS NOT NULL AND length(trim(p_notes)) > 20 THEN
    v_score := v_score + 5;
    v_factors := v_factors || jsonb_build_object('has_notes', 5);
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('lost', 'converted') THEN
    v_score := v_score + 5;
    v_factors := v_factors || jsonb_build_object('active', 5);
  END IF;

  IF v_score > 100 THEN v_score := 100; END IF;
  IF v_score < 0 THEN v_score := 0; END IF;

  RETURN jsonb_build_object('score', v_score, 'factors', v_factors);
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_score_lead()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := public.compute_lead_score(
    NEW.email,
    NEW.phone,
    NEW.event_date::date,
    NEW.estimated_budget,
    NEW.source,
    NEW.status,
    NEW.name,
    NEW.client_name,
    NEW.notes
  );

  NEW.lead_score := (v_result->>'score')::integer;
  NEW.score_factors := v_result->'factors';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_auto_score ON public.leads;
CREATE TRIGGER leads_auto_score
  BEFORE INSERT OR UPDATE OF email, phone, event_date, estimated_budget,
    source, status, name, client_name, notes
  ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_score_lead();

UPDATE public.leads l
SET
  lead_score = ((public.compute_lead_score(
    l.email, l.phone, l.event_date::date, l.estimated_budget, l.source,
    l.status, l.name, l.client_name, l.notes
  ))->>'score')::integer,
  score_factors = (public.compute_lead_score(
    l.email, l.phone, l.event_date::date, l.estimated_budget, l.source,
    l.status, l.name, l.client_name, l.notes
  ))->'factors';

COMMIT;
