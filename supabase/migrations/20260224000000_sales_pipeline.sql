-- 1. Tabela de estágios do pipeline
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  description text,
  color text DEFAULT '#8B5CF6',
  display_order integer NOT NULL,
  is_default boolean DEFAULT false,
  stage_type text CHECK (stage_type IN ('lead', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  automation_rules jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2. Tabela de leads (Criação base)
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Adição segura de colunas nativa do PostgreSQL (Substitui o bloco DO $$)
-- Isso garante que as colunas fiquem visíveis imediatamente para os índices abaixo
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp text;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS event_location text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS estimated_budget numeric;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS number_of_people integer;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_details text;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_stage_id uuid REFERENCES pipeline_stages(id);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_factors jsonb DEFAULT '{}'::jsonb;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS won_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_at timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason text;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to_client_id uuid REFERENCES wedding_clients(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to_project_id uuid REFERENCES projects(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at timestamptz;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;

-- Constraint isolada para não dar erro
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_status_check') THEN
        ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('active', 'won', 'lost', 'archived'));
    END IF;
END $$;

-- 4. Tabela de histórico de movimentação
CREATE TABLE IF NOT EXISTS lead_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  from_stage_id uuid REFERENCES pipeline_stages(id),
  to_stage_id uuid REFERENCES pipeline_stages(id),
  moved_by uuid REFERENCES auth.users(id),
  moved_at timestamptz DEFAULT now(),
  duration_minutes integer,
  notes text
);

-- 5. Tabela de interações com o lead
CREATE TABLE IF NOT EXISTS lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('call', 'email', 'whatsapp', 'meeting', 'note', 'quote_sent')),
  subject text,
  content text,
  duration_minutes integer,
  attachments text[],
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 6. Tabela de tarefas relacionadas ao lead
CREATE TABLE IF NOT EXISTS lead_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  due_time time,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES auth.users(id),
  reminder_minutes_before integer,
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 7. Tabela de campos customizáveis
CREATE TABLE IF NOT EXISTS pipeline_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multi_select', 'boolean')),
  field_options text[],
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 8. Índices (Agora a coluna current_stage_id é reconhecida com certeza)
DROP INDEX IF EXISTS leads_user_status_stage_idx;
CREATE INDEX leads_user_status_stage_idx ON leads(user_id, status, current_stage_id);

DROP INDEX IF EXISTS leads_event_date_idx;
CREATE INDEX leads_event_date_idx ON leads(event_date) WHERE event_date IS NOT NULL;

DROP INDEX IF EXISTS leads_score_idx;
CREATE INDEX leads_score_idx ON leads(lead_score DESC);

DROP INDEX IF EXISTS lead_stage_history_lead_moved_idx;
CREATE INDEX lead_stage_history_lead_moved_idx ON lead_stage_history(lead_id, moved_at DESC);

DROP INDEX IF EXISTS lead_interactions_lead_created_idx;
CREATE INDEX lead_interactions_lead_created_idx ON lead_interactions(lead_id, created_at DESC);

DROP INDEX IF EXISTS lead_tasks_lead_completed_due_idx;
CREATE INDEX lead_tasks_lead_completed_due_idx ON lead_tasks(lead_id, is_completed, due_date);

DROP INDEX IF EXISTS lead_tasks_assigned_completed_idx;
CREATE INDEX lead_tasks_assigned_completed_idx ON lead_tasks(assigned_to, is_completed);

-- 9. Row Level Security (RLS)
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_custom_fields ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage own pipeline" ON pipeline_stages;
    CREATE POLICY "Users can manage own pipeline"
      ON pipeline_stages FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can manage own leads" ON leads;
    CREATE POLICY "Users can manage own leads"
      ON leads FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    DROP POLICY IF EXISTS "Users can view own lead history" ON lead_stage_history;
    CREATE POLICY "Users can view own lead history"
      ON lead_stage_history FOR SELECT
      USING (lead_id IN (SELECT id FROM leads WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "Users can manage lead interactions" ON lead_interactions;
    CREATE POLICY "Users can manage lead interactions"
      ON lead_interactions FOR ALL
      USING (lead_id IN (SELECT id FROM leads WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "Users can manage lead tasks" ON lead_tasks;
    CREATE POLICY "Users can manage lead tasks"
      ON lead_tasks FOR ALL
      USING (lead_id IN (SELECT id FROM leads WHERE user_id = auth.uid()) OR assigned_to = auth.uid());
END $$;

-- 10. Seed: Estágios padrão
CREATE OR REPLACE FUNCTION create_default_pipeline_stages(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO pipeline_stages (user_id, name, description, color, display_order, is_default, stage_type)
  VALUES
    (p_user_id, 'Novo Lead', 'Leads que acabaram de chegar', '#3B82F6', 1, true, 'lead'),
    (p_user_id, 'Contato Feito', 'Primeiro contato realizado', '#8B5CF6', 2, true, 'contacted'),
    (p_user_id, 'Qualificado', 'Lead com potencial confirmado', '#10B981', 3, true, 'qualified'),
    (p_user_id, 'Proposta Enviada', 'Orçamento/proposta enviado', '#F59E0B', 4, true, 'proposal'),
    (p_user_id, 'Negociação', 'Em negociação de valores/datas', '#EC4899', 5, true, 'negotiation'),
    (p_user_id, 'Fechado/Ganho', 'Virou cliente!', '#10B981', 6, true, 'won'),
    (p_user_id, 'Perdido', 'Não converteu', '#EF4444', 7, true, 'lost')
  ON CONFLICT DO NOTHING;
END;
$$;

-- 11. Trigger CORRIGIDA para o Score (BEFORE INSERT OR UPDATE para evitar loop infinito)
CREATE OR REPLACE FUNCTION trigger_recalculate_lead_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_score integer := 0;
  v_factors jsonb := '{}'::jsonb;
  v_interactions_count integer := 0;
BEGIN
  -- Budget (0-30 pontos)
  IF NEW.estimated_budget >= 5000 THEN
    v_score := v_score + 30; v_factors := jsonb_set(v_factors, '{budget}', '30');
  ELSIF NEW.estimated_budget >= 3000 THEN
    v_score := v_score + 20; v_factors := jsonb_set(v_factors, '{budget}', '20');
  ELSIF NEW.estimated_budget >= 1000 THEN
    v_score := v_score + 10; v_factors := jsonb_set(v_factors, '{budget}', '10');
  END IF;
  
  -- Data do evento (0-20 pontos)
  IF NEW.event_date IS NOT NULL THEN
    IF NEW.event_date <= CURRENT_DATE + interval '30 days' THEN
      v_score := v_score + 20; v_factors := jsonb_set(v_factors, '{urgency}', '20');
    ELSIF NEW.event_date <= CURRENT_DATE + interval '90 days' THEN
      v_score := v_score + 15; v_factors := jsonb_set(v_factors, '{urgency}', '15');
    ELSIF NEW.event_date <= CURRENT_DATE + interval '180 days' THEN
      v_score := v_score + 10; v_factors := jsonb_set(v_factors, '{urgency}', '10');
    ELSE
      v_score := v_score + 5; v_factors := jsonb_set(v_factors, '{urgency}', '5');
    END IF;
  END IF;
  
  -- Origem (0-15 pontos)
  CASE NEW.source
    WHEN 'indicacao' THEN v_score := v_score + 15; v_factors := jsonb_set(v_factors, '{source}', '15');
    WHEN 'instagram' THEN v_score := v_score + 10; v_factors := jsonb_set(v_factors, '{source}', '10');
    WHEN 'google' THEN v_score := v_score + 8; v_factors := jsonb_set(v_factors, '{source}', '8');
    ELSE v_score := v_score + 5; v_factors := jsonb_set(v_factors, '{source}', '5');
  END CASE;
  
  -- Informações completas (0-20 pontos)
  IF NEW.email IS NOT NULL THEN v_score := v_score + 5; v_factors := jsonb_set(v_factors, '{has_email}', '5'); END IF;
  IF NEW.phone IS NOT NULL THEN v_score := v_score + 5; v_factors := jsonb_set(v_factors, '{has_phone}', '5'); END IF;
  IF NEW.event_date IS NOT NULL THEN v_score := v_score + 5; v_factors := jsonb_set(v_factors, '{has_date}', '5'); END IF;
  IF NEW.event_location IS NOT NULL THEN v_score := v_score + 5; v_factors := jsonb_set(v_factors, '{has_location}', '5'); END IF;
  
  -- Engajamento (0-15 pontos)
  IF TG_OP = 'UPDATE' THEN
    SELECT COUNT(*) INTO v_interactions_count FROM lead_interactions WHERE lead_id = NEW.id;
  END IF;
  
  IF v_interactions_count >= 5 THEN
    v_score := v_score + 15; v_factors := jsonb_set(v_factors, '{engagement}', '15');
  ELSIF v_interactions_count >= 3 THEN
    v_score := v_score + 10; v_factors := jsonb_set(v_factors, '{engagement}', '10');
  ELSIF v_interactions_count >= 1 THEN
    v_score := v_score + 5; v_factors := jsonb_set(v_factors, '{engagement}', '5');
  END IF;
  
  -- Atualiza o objeto NEW diretamente antes de salvar
  NEW.lead_score := LEAST(v_score, 100);
  NEW.score_factors := v_factors;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_lead_update ON leads;
CREATE TRIGGER before_lead_update
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_lead_score();

-- 12. Function Placeholder para Automações
CREATE OR REPLACE FUNCTION execute_stage_automations(p_lead_id uuid, p_stage_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_automation record;
  v_lead record;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  SELECT automation_rules INTO v_automation FROM pipeline_stages WHERE id = p_stage_id;
  -- Implementar baseado nas regras configuradas
  NULL;
END;
$$;

-- 13. Trigger: Registrar histórico de movimentação
CREATE OR REPLACE FUNCTION trigger_log_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_duration integer;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id THEN
    -- Calcular tempo no estágio anterior
    SELECT EXTRACT(EPOCH FROM (now() - moved_at)) / 60 INTO v_duration
    FROM lead_stage_history
    WHERE lead_id = NEW.id
    ORDER BY moved_at DESC
    LIMIT 1;
    
    INSERT INTO lead_stage_history (lead_id, from_stage_id, to_stage_id, moved_by, duration_minutes)
    VALUES (NEW.id, OLD.current_stage_id, NEW.current_stage_id, auth.uid(), COALESCE(v_duration, 0));
    
    PERFORM execute_stage_automations(NEW.id, NEW.current_stage_id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS track_stage_changes ON leads;
CREATE TRIGGER track_stage_changes
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_stage_change();