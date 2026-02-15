-- Tabela de templates de mensagem
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'booking_confirmation',
    'reminder_7days',
    'reminder_24h',
    'post_event_review',
    'reengagement_30days',
    'birthday',
    'anniversary',
    'abandoned_quote'
  )),
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms')),
  subject text, -- Para emails
  body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb, -- ["{client_name}", "{event_date}", etc]
  is_active boolean DEFAULT true,
  send_at_time time, -- Horário preferido para envio
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de follow-ups agendados
CREATE TABLE IF NOT EXISTS scheduled_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  template_id uuid REFERENCES message_templates(id),
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index para performance
CREATE INDEX ON scheduled_followups(scheduled_for) WHERE status = 'pending';
CREATE INDEX ON scheduled_followups(project_id);

-- Function para agendar follow-ups automaticamente
CREATE OR REPLACE FUNCTION schedule_project_followups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template record;
  v_scheduled_date timestamptz;
  v_project_date date;
  v_project_time time;
  v_event_datetime timestamptz;
BEGIN
  -- Get project details correctly
  -- Assuming 'event_date' is a date column in projects table based on context
  -- If it's timestamptz, cast it. Sticking to safer assumption it might be mixed type or needs casting.
  -- The prompt used NEW.event_date directly in calculations.
  
  -- Para cada template ativo do usuário
  FOR v_template IN 
    SELECT * FROM message_templates 
    WHERE user_id = (SELECT user_id FROM projects WHERE id = NEW.id)
      AND is_active = true
  LOOP
    -- Calcular data de envio baseado no trigger
    -- Note: We assume event_date is a timestamp or date that can be operated on.
    
    v_scheduled_date := CASE v_template.trigger_type
      WHEN 'booking_confirmation' THEN now() + interval '5 minutes'
      WHEN 'reminder_7days' THEN (NEW.event_date::timestamp) - interval '7 days'
      WHEN 'reminder_24h' THEN (NEW.event_date::timestamp) - interval '24 hours'
      WHEN 'post_event_review' THEN (NEW.event_date::timestamp) + interval '1 day'
      WHEN 'reengagement_30days' THEN (NEW.event_date::timestamp) + interval '30 days'
      ELSE NULL
    END;

    -- Aplicar horário preferido se definido
    IF v_template.send_at_time IS NOT NULL AND v_scheduled_date IS NOT NULL THEN
      v_scheduled_date := date_trunc('day', v_scheduled_date) + v_template.send_at_time;
    END IF;

    -- Agendar apenas se a data for futura e válida
    IF v_scheduled_date IS NOT NULL AND v_scheduled_date > now() THEN
      INSERT INTO scheduled_followups (project_id, template_id, scheduled_for)
      VALUES (NEW.id, v_template.id, v_scheduled_date);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger para agendar ao criar projeto
DROP TRIGGER IF EXISTS auto_schedule_followups ON projects;
CREATE TRIGGER auto_schedule_followups
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION schedule_project_followups();

-- RLS Policies
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own templates" ON message_templates;

CREATE POLICY "Users can manage their own templates" 
  ON message_templates 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their project followups"
  ON scheduled_followups
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scheduled_followups.project_id 
      AND projects.user_id = auth.uid()
    )
  );
