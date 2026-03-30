-- Function to execute automations when a lead changes stage
CREATE OR REPLACE FUNCTION execute_stage_automations(
  p_lead_id uuid,
  p_old_stage_id uuid,
  p_new_stage_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stage record;
  v_lead record;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  SELECT * INTO v_stage FROM pipeline_stages WHERE id = p_new_stage_id;

  IF NOT FOUND THEN RETURN; END IF;

  INSERT INTO assistant_notifications (
    user_id, title, message, type, action_link
  ) VALUES (
    v_lead.user_id,
    'Lead movido para ' || v_stage.name,
    v_lead.name || ' avançou no pipeline',
    'info',
    '/pipeline?lead=' || p_lead_id::text
  );

  INSERT INTO analytics_logs (user_id, event_name, event_data)
  VALUES (
    v_lead.user_id,
    'STAGE_CHANGE',
    jsonb_build_object(
      'lead_id', p_lead_id,
      'lead_name', v_lead.name,
      'old_stage', p_old_stage_id,
      'new_stage', p_new_stage_id,
      'stage_name', v_stage.name
    )
  );

  IF v_stage.name = 'Fechado' THEN
    UPDATE leads SET status = 'won', updated_at = now()
    WHERE id = p_lead_id;
  ELSIF v_stage.name = 'Perdido' THEN
    UPDATE leads SET status = 'lost', updated_at = now()
    WHERE id = p_lead_id;
  END IF;
END;
$$;
