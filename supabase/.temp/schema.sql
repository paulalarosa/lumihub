


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'editor',
    'viewer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_assistant_invite"("p_invite_token" "text", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invite record;
  v_assistant_id uuid;
  v_access_exists boolean;
BEGIN
  -- Buscar convite
  SELECT * INTO v_invite
  FROM public.assistant_invites
  WHERE invite_token = p_invite_token
    AND status = 'pending'
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  
  -- Verificar se usuário já é assistente (pelo user_id)
  SELECT id INTO v_assistant_id
  FROM public.assistants
  WHERE user_id = p_user_id;
  
  -- Se não existe, criar perfil de assistente
  IF v_assistant_id IS NULL THEN
    INSERT INTO public.assistants (user_id, full_name, phone)
    VALUES (
      p_user_id,
      COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = p_user_id), 'Assistant'),
      (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = p_user_id)
    )
    RETURNING id INTO v_assistant_id;
  END IF;
  
  -- Verificar se já tem acesso ativo
  SELECT EXISTS(
    SELECT 1 FROM public.assistant_access
    WHERE assistant_id = v_assistant_id
      AND makeup_artist_id = v_invite.makeup_artist_id
      AND status = 'active'
  ) INTO v_access_exists;
  
  -- Se não tem, criar acesso
  IF NOT v_access_exists THEN
    INSERT INTO public.assistant_access (assistant_id, makeup_artist_id)
    VALUES (v_assistant_id, v_invite.makeup_artist_id);
  END IF;
  
  -- Atualizar status do convite
  UPDATE public.assistant_invites
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invite.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'assistant_id', v_assistant_id,
    'is_new_connection', NOT v_access_exists
  );
END;
$$;


ALTER FUNCTION "public"."accept_assistant_invite"("p_invite_token" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_engagement_rate"("p_likes" integer, "p_comments" integer, "p_saves" integer, "p_followers" integer) RETURNS numeric
    LANGUAGE "sql" IMMUTABLE
    AS $$
  SELECT ROUND(
    ((p_likes + p_comments + p_saves)::numeric / NULLIF(p_followers, 0)) * 100,
    2
  );
$$;


ALTER FUNCTION "public"."calculate_engagement_rate"("p_likes" integer, "p_comments" integer, "p_saves" integer, "p_followers" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_and_unlock_achievements"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_achievement record;
  v_count integer;
  -- v_value numeric; -- Removido se não usado
  v_should_unlock boolean;
BEGIN
  FOR v_achievement IN 
    SELECT * FROM achievements 
  LOOP
    -- Verificar se já desbloqueou
    IF EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = p_user_id AND badge_id = v_achievement.badge_id
    ) THEN
      CONTINUE;
    END IF;
    
    v_should_unlock := false;
    
    -- Verificar critério baseado no tipo
    CASE v_achievement.badge_id
      WHEN 'first_login' THEN
        v_should_unlock := true;
        
      WHEN 'profile_complete' THEN
        SELECT COUNT(*) INTO v_count
        FROM user_onboarding
        WHERE user_id = p_user_id AND profile_customized = true;
        v_should_unlock := v_count > 0;
        
      WHEN 'first_client' THEN
        SELECT COUNT(*) INTO v_count
        FROM wedding_clients
        WHERE user_id = p_user_id;
        v_should_unlock := v_count >= 1;
        
      WHEN 'first_event' THEN
        SELECT COUNT(*) INTO v_count
        FROM projects
        WHERE user_id = p_user_id;
        v_should_unlock := v_count >= 1;
        
      WHEN 'rising_star' THEN
        SELECT COUNT(*) INTO v_count
        FROM reviews r
        JOIN projects p ON p.id = r.project_id
        WHERE p.user_id = p_user_id AND r.rating = 5 AND r.status = 'approved';
        v_should_unlock := v_count >= 5;
        
      WHEN 'beauty_boss' THEN
        SELECT COUNT(*) INTO v_count
        FROM projects
        WHERE user_id = p_user_id AND status = 'completed';
        v_should_unlock := v_count >= 10;
        
      WHEN 'pro_100' THEN
        SELECT COUNT(*) INTO v_count
        FROM projects
        WHERE user_id = p_user_id AND status = 'completed';
        v_should_unlock := v_count >= 100;
        
      WHEN 'microsite_pro' THEN
        SELECT COUNT(*) INTO v_count
        FROM microsites
        WHERE user_id = p_user_id AND is_published = true;
        v_should_unlock := v_count > 0;
        
      ELSE
        NULL;
    END CASE;
    
    -- Desbloquear se critério foi atingido
    IF v_should_unlock THEN
      INSERT INTO user_achievements (user_id, badge_id)
      VALUES (p_user_id, v_achievement.badge_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."check_and_unlock_achievements"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_assistant_exists"("p_email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid;
  v_assistant_id uuid;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('exists', false, 'is_assistant', false);
  END IF;
  
  -- Verificar se é assistente
  SELECT id INTO v_assistant_id
  FROM public.assistants
  WHERE user_id = v_user_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'exists', true, 
      'is_assistant', true,
      'assistant_id', v_assistant_id
    );
  ELSE
    RETURN jsonb_build_object('exists', true, 'is_assistant', false);
  END IF;
END;
$$;


ALTER FUNCTION "public"."check_assistant_exists"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_plan_limit"("p_user_id" "uuid", "p_feature" "text", "p_count" integer DEFAULT NULL::integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_plan_type text;
  v_plan_status text;
  v_limits record;
  v_current_count integer;
BEGIN
  -- Buscar plano do usuário
  SELECT plan_type, plan_status INTO v_plan_type, v_plan_status
  FROM makeup_artists
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'user_not_found'
    );
  END IF;

  -- Verificar se plano está ativo
  IF v_plan_status != 'active' AND v_plan_status != 'trialing' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'plan_inactive',
      'plan_status', v_plan_status
    );
  END IF;

  -- Buscar limites do plano
  SELECT * INTO v_limits
  FROM plan_limits
  WHERE plan_type = v_plan_type;

  -- Verificar feature específica
  IF p_feature = 'max_clients' THEN
    IF v_limits.max_clients IS NULL THEN
      -- Ilimitado
      RETURN jsonb_build_object('allowed', true, 'limit', 'unlimited');
    END IF;

    -- Contar clientes atuais
    SELECT COUNT(*) INTO v_current_count
    FROM wedding_clients
    WHERE user_id = p_user_id;

    IF v_current_count >= v_limits.max_clients THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'limit_reached',
        'current', v_current_count,
        'limit', v_limits.max_clients
      );
    END IF;

    RETURN jsonb_build_object(
      'allowed', true,
      'current', v_current_count,
      'limit', v_limits.max_clients
    );
  END IF;

  -- Verificar acesso a feature booleana
  IF v_limits.features ? p_feature THEN
    IF (v_limits.features->p_feature)::boolean = true THEN
      RETURN jsonb_build_object('allowed', true);
    ELSE
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'feature_not_in_plan',
        'required_plan', get_required_plan(p_feature)
      );
    END IF;
  END IF;

  -- Feature não encontrada
  RETURN jsonb_build_object(
    'allowed', false,
    'reason', 'feature_unknown'
  );
END;
$$;


ALTER FUNCTION "public"."check_plan_limit"("p_user_id" "uuid", "p_feature" "text", "p_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_assistant_invite"("p_makeup_artist_id" "uuid", "p_assistant_email" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_invite_id uuid;
  v_invite_link text;
begin
  -- Check if invite already exists
  select id into v_invite_id
  from assistant_invites
  where makeup_artist_id = p_makeup_artist_id
  and email = p_assistant_email
  and status = 'pending';

  if v_invite_id is not null then
    return json_build_object(
      'success', false,
      'message', 'Convite já enviado para este email.'
    );
  end if;

  -- Create invite
  insert into assistant_invites (makeup_artist_id, email, status, role)
  values (p_makeup_artist_id, p_assistant_email, 'pending', 'assistant')
  returning id into v_invite_id;

  -- Generate simplified link (in prod this would be specific)
  v_invite_link := current_setting('request.headers')::json->>'origin' || '/auth/register?invite=' || v_invite_id;

  return json_build_object(
    'success', true,
    'message', 'Convite criado com sucesso.',
    'invite_link', v_invite_link,
    'invite_id', v_invite_id
  );
exception
  when others then
    return json_build_object(
      'success', false,
      'message', SQLERRM
    );
end;
$$;


ALTER FUNCTION "public"."create_assistant_invite"("p_makeup_artist_id" "uuid", "p_assistant_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_pipeline_stages"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."create_default_pipeline_stages"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_auditing"("table_name_input" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    EXECUTE format('
        DROP TRIGGER IF EXISTS tr_audit_%I ON public.%I;
        CREATE TRIGGER tr_audit_%I
        AFTER INSERT OR UPDATE OR DELETE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
    ', table_name_input, table_name_input, table_name_input, table_name_input);
END;
$$;


ALTER FUNCTION "public"."enable_auditing"("table_name_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_stage_automations"("p_lead_id" "uuid", "p_stage_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."execute_stage_automations"("p_lead_id" "uuid", "p_stage_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_old_invites"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.assistant_invites
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
  
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."expire_old_invites"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_signature_hash"("p_signer_name" "text", "p_signer_email" "text", "p_signer_cpf" "text", "p_signature_data" "text", "p_contract_id" "uuid", "p_timestamp" timestamp with time zone, "p_ip_address" "text", "p_device_fingerprint" "text") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN encode(
    digest(
      p_signer_name || p_signer_email || COALESCE(p_signer_cpf, '') ||
      left(p_signature_data, 200) || p_contract_id::text ||
      EXTRACT(epoch FROM (p_timestamp AT TIME ZONE 'UTC'))::text ||
      p_ip_address || COALESCE(p_device_fingerprint, ''),
      'sha256'
    ),
    'hex'
  );
END;
$$;


ALTER FUNCTION "public"."generate_signature_hash"("p_signer_name" "text", "p_signer_email" "text", "p_signer_cpf" "text", "p_signature_data" "text", "p_contract_id" "uuid", "p_timestamp" timestamp with time zone, "p_ip_address" "text", "p_device_fingerprint" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_client json;
  v_projects json;
  v_contracts json;
  v_events json;
BEGIN
  SELECT row_to_json(c) INTO v_client 
  FROM (SELECT id, full_name, email, phone, portal_link FROM public.clients WHERE id = p_client_id) c;
  
  SELECT json_agg(p) INTO v_projects 
  FROM (SELECT * FROM public.projects WHERE client_id = p_client_id) p;
  
  SELECT json_agg(ct) INTO v_contracts 
  FROM (SELECT * FROM public.contracts WHERE client_id = p_client_id) ct;
  
  SELECT json_agg(e) INTO v_events 
  FROM (SELECT * FROM public.events WHERE client_id = p_client_id) e;

  RETURN json_build_object(
    'client', v_client,
    'projects', v_projects,
    'contracts', v_contracts,
    'events', v_events
  );
END;
$$;


ALTER FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid", "p_pin" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result json;
BEGIN
    -- Verifica se o PIN ainda é válido antes de entregar os dados
    IF EXISTS (SELECT 1 FROM public.wedding_clients WHERE id = p_client_id AND access_pin = p_pin) THEN
        SELECT json_build_object(
            'client', (SELECT row_to_json(c) FROM (SELECT id, full_name, email, phone, portal_link FROM public.wedding_clients WHERE id = p_client_id) c),
            'projects', (SELECT json_agg(p) FROM (SELECT id, name, status, created_at FROM public.projects WHERE client_id = p_client_id) p),
            'contracts', (SELECT json_agg(ct) FROM (SELECT id, title, status, signed_at FROM public.contracts WHERE client_id = p_client_id) ct),
            'events', (SELECT json_agg(e) FROM (SELECT id, title, event_date, start_time, location FROM public.events WHERE client_id = p_client_id) e)
        ) INTO result;
        
        RETURN result;
    ELSE
        RETURN json_build_object('error', 'Unauthorized');
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid", "p_pin" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_required_plan"("p_feature" "text") RETURNS "text"
    LANGUAGE "sql"
    AS $$
  SELECT plan_type
  FROM plan_limits
  WHERE features->p_feature = 'true'::jsonb
  ORDER BY 
    CASE plan_type
      WHEN 'essencial' THEN 1
      WHEN 'profissional' THEN 2
      WHEN 'studio' THEN 3
    END
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_required_plan"("p_feature" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_invoice_paid_feedback"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        PERFORM public.send_templated_email(
            (SELECT email FROM public.wedding_clients WHERE id = NEW.client_id),
            'Khaos_Feedback',
            jsonb_build_object(
                'name', (SELECT name FROM public.wedding_clients WHERE id = NEW.client_id),
                'order_id', NEW.id,
                'amount', NEW.amount
            ),
            NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_invoice_paid_feedback"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    PERFORM public.send_templated_email(
        new.email,
        'Khaos_Welcome',
        jsonb_build_object(
            'name', COALESCE(new.raw_user_meta_data->>'name', 'Cliente'),
            'email', new.email
        ),
        new.id
    );
    RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_project_tracking"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
        PERFORM public.send_templated_email(
            (SELECT email FROM public.wedding_clients WHERE id = NEW.client_id),
            'Khaos_Tracking',
            jsonb_build_object(
                'name', (SELECT name FROM public.wedding_clients WHERE id = NEW.client_id),
                'project_name', NEW.name,
                'status', 'Em Andamento'
            ),
            NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_project_tracking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_knowledge"("query_embedding" "public"."vector", "match_threshold" double precision DEFAULT 0.6, "match_count" integer DEFAULT 3) RETURNS TABLE("id" "uuid", "title" "text", "content" "text", "similarity" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  select
    id,
    title,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;


ALTER FUNCTION "public"."match_knowledge"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
    v_source TEXT;
BEGIN
    v_user_id := (auth.uid());
    
    -- In triggers, we don't easily get the source unless we use a session variable
    -- For now, default to DB_TRIGGER as specified in the column default.
    -- Future expansion: current_setting('kontrol.audit_source', true)
    
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_data, new_data)
        VALUES (v_user_id, TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb, NULL);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_data, new_data)
        VALUES (v_user_id, TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_data, new_data)
        VALUES (v_user_id, TG_TABLE_NAME, NEW.id, 'INSERT', NULL, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."process_audit_log"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_instagram_token"("p_connection_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Implementar refresh de token via Meta Graph API
  -- Nota: Tokens de longa duração duram 60 dias
  NULL;
END;
$$;


ALTER FUNCTION "public"."refresh_instagram_token"("p_connection_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_templated_email"("recipient" "text", "template_name" "text", "template_data" "jsonb", "user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-ses-email',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
        ),
        body := jsonb_build_object(
            'to', jsonb_build_array(recipient),
            'template', template_name,
            'templateData', template_data,
            'userId', user_id
        )
    );
END;
$$;


ALTER FUNCTION "public"."send_templated_email"("recipient" "text", "template_name" "text", "template_data" "jsonb", "user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."send_templated_email"("recipient" "text", "template_name" "text", "template_data" "jsonb", "user_id" "uuid") IS 'Central KONTROL Mailer - Unified SES Dispatch v1.0';



CREATE OR REPLACE FUNCTION "public"."trigger_check_achievements"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM check_and_unlock_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_check_achievements"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_log_stage_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."trigger_log_stage_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_recalculate_lead_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."trigger_recalculate_lead_score"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_bride_pin"("client_id" "uuid", "pin_code" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.wedding_clients 
    WHERE id = client_id 
    AND TRIM(access_pin) = TRIM(pin_code)
    AND is_bride = true
  );
END;
$$;


ALTER FUNCTION "public"."validate_bride_pin"("client_id" "uuid", "pin_code" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "badge_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "category" "text",
    "requirement_type" "text" NOT NULL,
    "requirement_value" integer,
    "reward_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "achievements_category_check" CHECK (("category" = ANY (ARRAY['onboarding'::"text", 'engagement'::"text", 'growth'::"text", 'social'::"text", 'expert'::"text"])))
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "client_id" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "event_type" "text",
    "status" "text" DEFAULT 'Agendado'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "total_value" numeric(10,2) DEFAULT 0,
    "assistant_commission" numeric(10,2) DEFAULT 0,
    "assistant_id" "uuid",
    CONSTRAINT "appointments_event_type_check" CHECK (("event_type" = ANY (ARRAY['Noivas'::"text", 'Pré Wedding'::"text", 'Produções Sociais'::"text"])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assistant_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assistant_id" "uuid" NOT NULL,
    "makeup_artist_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "revoked_at" timestamp with time zone,
    CONSTRAINT "assistant_access_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."assistant_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assistant_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "makeup_artist_id" "uuid" NOT NULL,
    "assistant_email" "text" NOT NULL,
    "invite_token" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email_status" "text" DEFAULT 'verified'::"text",
    CONSTRAINT "assistant_invites_email_status_check" CHECK (("email_status" = ANY (ARRAY['verified'::"text", 'invalid'::"text", 'unsubscribed'::"text"]))),
    CONSTRAINT "assistant_invites_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."assistant_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assistant_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text",
    "read" boolean DEFAULT false,
    "action_link" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."assistant_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assistants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "is_upgraded" boolean DEFAULT false,
    "upgraded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assistants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assistants_legacy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "email" "text" NOT NULL,
    "phone" "text",
    "is_registered" boolean DEFAULT false,
    "status" "text" DEFAULT 'pending'::"text",
    "invite_token" "uuid" DEFAULT "gen_random_uuid"(),
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "assistant_user_id" "text"
);


ALTER TABLE "public"."assistants_legacy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "source" "text" DEFAULT 'DB_TRIGGER'::"text",
    CONSTRAINT "audit_logs_action_check" CHECK (("action" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_logs" IS 'KONTROL Audit Trail - Saturation Level v1.0';



COMMENT ON COLUMN "public"."audit_logs"."source" IS 'The origin of the change (WEB_UI, DB_TRIGGER, API_SYNC)';



CREATE TABLE IF NOT EXISTS "public"."backup_integrity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "status" "text",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."backup_integrity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bride_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "professional_id" "uuid",
    "bride_name" "text",
    "event_date" "date",
    "access_token" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "client_id" "text"
);


ALTER TABLE "public"."bride_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."briefings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "content" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "briefings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'revision'::"text"])))
);


ALTER TABLE "public"."briefings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "location" "text",
    "event_type" "text",
    "status" "text" DEFAULT 'confirmed'::"text",
    "project_id" "uuid",
    "google_event_id" "text",
    "google_calendar_id" "text",
    "is_synced" boolean DEFAULT false,
    "last_synced_at" timestamp with time zone,
    "sync_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "calendar_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['wedding'::"text", 'social'::"text", 'test'::"text", 'personal'::"text", 'blocked'::"text"]))),
    CONSTRAINT "calendar_events_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'tentative'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_google_sync" CHECK (((("google_event_id" IS NULL) AND ("google_calendar_id" IS NULL)) OR (("google_event_id" IS NOT NULL) AND ("google_calendar_id" IS NOT NULL))))
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chat_history_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."chat_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "role" "text" DEFAULT 'user'::"text",
    "avatar_url" "text",
    "first_name" "text",
    "last_name" "text",
    "slug" "text",
    "plan" "text" DEFAULT 'free'::"text",
    "bio" "text",
    "onboarding_completed" boolean DEFAULT false,
    "business_name" "text",
    "subscription_status" "text" DEFAULT 'active'::"text",
    "financial_goal" numeric DEFAULT 0,
    "total_clients" integer DEFAULT 0,
    "growth_client_percentage" numeric DEFAULT 0,
    "parent_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "google_calendar_connected" boolean DEFAULT false,
    "phone" "text",
    "subscription_tier" "text" DEFAULT 'trial'::"text",
    "has_completed_onboarding" boolean DEFAULT false,
    "updated_at'" "text",
    "profiles.role" "text",
    "name" "text",
    "document_id" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "birth_date" "date",
    "contract_url" "text",
    "logo_url" "text",
    "website" "text",
    "email_status" "text" DEFAULT 'verified'::"text",
    "stripe_customer_id" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."clients" WITH ("security_invoker"='true') AS
 SELECT "id",
    "first_name",
    "last_name",
    (("first_name" || ' '::"text") || "last_name") AS "name",
    "email",
    "phone",
    "birth_date",
    "contract_url",
    "created_at"
   FROM "public"."profiles";


ALTER VIEW "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contextual_tips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_path" "text" NOT NULL,
    "element_selector" "text",
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "show_when" "text",
    "show_after_days" integer DEFAULT 0,
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contextual_tips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text",
    "attachment_url" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "signature_url" "text",
    "signed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "signature_ip" "text",
    "signature_data" "text",
    "project_id" "uuid"
);


ALTER TABLE "public"."contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_assistants" (
    "event_id" "uuid" NOT NULL,
    "assistant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."event_assistants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "event_date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "location" "text",
    "status" "text" DEFAULT 'scheduled'::"text",
    "tags" "text"[],
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "client_id" "uuid",
    "project_id" "uuid",
    "address" "text",
    "advisory_time" "text",
    "arrival_time" "text",
    "ceremony_time" "text",
    "color" "text",
    "event_type" "text",
    "latitude" "text",
    "longitude" "text",
    "making_of_time" "text",
    "notes" "text",
    "reminder_days" "text",
    "assistant_commission" numeric DEFAULT 0,
    "assistant_id" "uuid",
    "total_value" numeric DEFAULT 0
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_overview" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "total_revenue" numeric DEFAULT 0,
    "total_payouts" numeric DEFAULT 0,
    "net_profit" numeric DEFAULT 0,
    "month" "date" DEFAULT CURRENT_DATE,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."financial_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."google_calendar_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "token_expiry" timestamp with time zone NOT NULL,
    "calendar_id" "text",
    "sync_token" "text",
    "channel_id" "text",
    "resource_id" "text",
    "channel_expiry" timestamp with time zone,
    "last_sync_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."google_calendar_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "makeup_artist_id" "uuid",
    "instagram_user_id" "text" NOT NULL,
    "username" "text" NOT NULL,
    "profile_picture_url" "text",
    "access_token" "text" NOT NULL,
    "token_expires_at" timestamp with time zone,
    "scopes" "text"[] DEFAULT ARRAY[]::"text"[],
    "followers_count" integer DEFAULT 0,
    "following_count" integer DEFAULT 0,
    "media_count" integer DEFAULT 0,
    "is_connected" boolean DEFAULT true,
    "last_synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."instagram_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_hashtag_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "category" "text" NOT NULL,
    "hashtags" "text"[] NOT NULL,
    "avg_reach" numeric DEFAULT 0,
    "usage_count" integer DEFAULT 0,
    "generated_by_ai" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."instagram_hashtag_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "instagram_connection_id" "uuid",
    "conversation_id" "text" NOT NULL,
    "sender_id" "text" NOT NULL,
    "sender_username" "text",
    "recipient_id" "text" NOT NULL,
    "message_text" "text",
    "message_timestamp" timestamp with time zone NOT NULL,
    "is_from_customer" boolean DEFAULT true,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "replied_at" timestamp with time zone,
    "reply_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."instagram_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_post_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "caption_template" "text" NOT NULL,
    "hashtags" "text"[] DEFAULT ARRAY[]::"text"[],
    "category" "text",
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."instagram_post_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "instagram_connection_id" "uuid",
    "instagram_media_id" "text" NOT NULL,
    "media_type" "text",
    "media_url" "text",
    "permalink" "text",
    "caption" "text",
    "timestamp" timestamp with time zone,
    "like_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    "saved_count" integer DEFAULT 0,
    "reach" integer DEFAULT 0,
    "impressions" integer DEFAULT 0,
    "engagement_rate" numeric DEFAULT 0,
    "last_synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."instagram_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_scheduled_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "instagram_connection_id" "uuid",
    "caption" "text" NOT NULL,
    "media_urls" "text"[] NOT NULL,
    "media_type" "text",
    "hashtags" "text"[] DEFAULT ARRAY[]::"text"[],
    "location_id" "text",
    "location_name" "text",
    "scheduled_for" timestamp with time zone NOT NULL,
    "timezone" "text" DEFAULT 'America/Sao_Paulo'::"text",
    "status" "text" DEFAULT 'scheduled'::"text",
    "published_at" timestamp with time zone,
    "instagram_media_id" "text",
    "instagram_permalink" "text",
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "instagram_scheduled_posts_media_type_check" CHECK (("media_type" = ANY (ARRAY['image'::"text", 'video'::"text", 'carousel'::"text"]))),
    CONSTRAINT "instagram_scheduled_posts_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'publishing'::"text", 'published'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."instagram_scheduled_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "client_id" "uuid",
    "amount" numeric(15,2) NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "due_date" "date",
    "paid_at" timestamp with time zone,
    "invoice_number" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_base" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(768),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."knowledge_base" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid",
    "type" "text" NOT NULL,
    "subject" "text",
    "content" "text",
    "duration_minutes" integer,
    "attachments" "text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "lead_interactions_type_check" CHECK (("type" = ANY (ARRAY['call'::"text", 'email'::"text", 'whatsapp'::"text", 'meeting'::"text", 'note'::"text", 'quote_sent'::"text"])))
);


ALTER TABLE "public"."lead_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_stage_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid",
    "from_stage_id" "uuid",
    "to_stage_id" "uuid",
    "moved_by" "uuid",
    "moved_at" timestamp with time zone DEFAULT "now"(),
    "duration_minutes" integer,
    "notes" "text"
);


ALTER TABLE "public"."lead_stage_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "due_date" "date",
    "due_time" time without time zone,
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "completed_by" "uuid",
    "priority" "text" DEFAULT 'medium'::"text",
    "assigned_to" "uuid",
    "reminder_minutes_before" integer,
    "reminder_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "lead_tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"])))
);


ALTER TABLE "public"."lead_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "client_name" "text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text",
    "value" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "email_status" "text" DEFAULT 'verified'::"text",
    "name" "text",
    "phone" "text",
    "whatsapp" "text",
    "event_type" "text",
    "event_date" "date",
    "event_location" "text",
    "estimated_budget" numeric,
    "number_of_people" integer,
    "source" "text",
    "source_details" "text",
    "current_stage_id" "uuid",
    "lead_score" integer DEFAULT 50,
    "score_factors" "jsonb" DEFAULT '{}'::"jsonb",
    "won_at" timestamp with time zone,
    "lost_at" timestamp with time zone,
    "lost_reason" "text",
    "converted_to_client_id" "uuid",
    "converted_to_project_id" "uuid",
    "converted_at" timestamp with time zone,
    "assigned_to" "uuid",
    "notes" "text",
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "leads_email_status_check" CHECK (("email_status" = ANY (ARRAY['verified'::"text", 'invalid'::"text", 'unsubscribed'::"text"]))),
    CONSTRAINT "leads_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'won'::"text", 'lost'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."makeup_artists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "business_name" "text" NOT NULL,
    "phone" "text",
    "plan_type" "text" DEFAULT 'free'::"text",
    "subscription_status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "cpf" "text",
    "address" "text",
    "plan_status" "text" DEFAULT 'active'::"text",
    "plan_started_at" timestamp with time zone,
    "plan_expires_at" timestamp with time zone,
    "monthly_price" numeric DEFAULT 39.90,
    "trial_ends_at" timestamp with time zone,
    CONSTRAINT "makeup_artists_plan_status_check" CHECK (("plan_status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'past_due'::"text", 'trialing'::"text"]))),
    CONSTRAINT "makeup_artists_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['free'::"text", 'basic'::"text", 'pro'::"text"])))
);


ALTER TABLE "public"."makeup_artists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketing_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "scheduled_for" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."marketing_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid"
);


ALTER TABLE "public"."message_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moodboard_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_url" "text" NOT NULL,
    "title" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "project_id" "uuid"
);


ALTER TABLE "public"."moodboard_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "notification_id" "uuid",
    "status" "text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."notification_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" numeric NOT NULL,
    "status" "text" DEFAULT 'requested'::"text",
    "bank_info" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_custom_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "field_name" "text" NOT NULL,
    "field_type" "text" NOT NULL,
    "field_options" "text"[],
    "is_required" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pipeline_custom_fields_field_type_check" CHECK (("field_type" = ANY (ARRAY['text'::"text", 'number'::"text", 'date'::"text", 'select'::"text", 'multi_select'::"text", 'boolean'::"text"])))
);


ALTER TABLE "public"."pipeline_custom_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#8B5CF6'::"text",
    "display_order" integer NOT NULL,
    "is_default" boolean DEFAULT false,
    "stage_type" "text",
    "automation_rules" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pipeline_stages_stage_type_check" CHECK (("stage_type" = ANY (ARRAY['lead'::"text", 'contacted'::"text", 'qualified'::"text", 'proposal'::"text", 'negotiation'::"text", 'won'::"text", 'lost'::"text"])))
);


ALTER TABLE "public"."pipeline_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_limits" (
    "plan_type" "text" NOT NULL,
    "max_clients" integer,
    "max_projects_per_month" integer,
    "max_team_members" integer,
    "features" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plan_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "service_id" "uuid",
    "price" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "quantity" "text",
    "total_price" "text",
    "unit_price" numeric,
    "user_id" "text"
);


ALTER TABLE "public"."project_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "client_id" "uuid",
    "status" "text" DEFAULT 'planning'::"text",
    "start_date" "date" DEFAULT CURRENT_DATE,
    "deadline" "date",
    "budget" numeric DEFAULT 0.00,
    "description" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text",
    "tags" "text"[],
    "cover_url" "text",
    "type" "text",
    "end_date" timestamp with time zone,
    "event_date" timestamp with time zone,
    "event_location" "text",
    "event_time" time without time zone,
    "location" "text",
    "details" "text",
    "notes" "text",
    "event_type" "text",
    "total_budget" numeric DEFAULT 0,
    "client_cpf" "text",
    "total_value" numeric DEFAULT 0,
    CONSTRAINT "projects_status_check" CHECK (("status" = ANY (ARRAY['planning'::"text", 'in_progress'::"text", 'review'::"text", 'completed'::"text", 'cancelled'::"text"])))
);

ALTER TABLE ONLY "public"."projects" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."projects"."client_id" IS 'Foreign key to wedding_clients';



COMMENT ON COLUMN "public"."projects"."event_location" IS 'Localização do evento associado ao projeto';



CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "description" "text",
    "base_price" numeric(15,2),
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "price" "text",
    "duration_minutes" "text",
    "is_active" "text",
    "title" "text",
    "sort_order" integer DEFAULT 0,
    "default_price" "text"
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_type" "text" DEFAULT 'pro'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "mp_subscription_id" "text",
    "mp_payer_id" "text",
    "mp_preference_id" "text",
    "price_monthly" numeric DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'BRL'::"text",
    "trial_ends_at" timestamp with time zone,
    "current_period_start" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_period_end" timestamp with time zone DEFAULT ("now"() + '30 days'::interval) NOT NULL,
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "stripe_subscription_id" "text",
    "stripe_customer_id" "text",
    CONSTRAINT "subscriptions_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['basic'::"text", 'pro'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'past_due'::"text", 'trialing'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_conflicts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "conflict_type" "text" NOT NULL,
    "khaos_version" "jsonb" NOT NULL,
    "google_version" "jsonb" NOT NULL,
    "resolved" boolean DEFAULT false,
    "resolution" "text",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sync_conflicts_conflict_type_check" CHECK (("conflict_type" = ANY (ARRAY['update_conflict'::"text", 'delete_conflict'::"text", 'create_duplicate'::"text"])))
);


ALTER TABLE "public"."sync_conflicts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sync_direction" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "event_id" "uuid",
    "google_event_id" "text",
    "success" boolean NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sync_log_operation_check" CHECK (("operation" = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text"]))),
    CONSTRAINT "sync_log_sync_direction_check" CHECK (("sync_direction" = ANY (ARRAY['khaos_to_google'::"text", 'google_to_khaos'::"text"])))
);


ALTER TABLE "public"."sync_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."system_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "level" "text" DEFAULT 'info'::"text",
    "message" "text",
    "user_id" "uuid",
    "metadata" "text",
    "severity" "text",
    "timestamp" "text"
);


ALTER TABLE "public"."system_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'todo'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "due_date" timestamp with time zone,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "sort_order" integer DEFAULT 0,
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['todo'::"text", 'in_progress'::"text", 'review'::"text", 'done'::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" DEFAULT 'assistant'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."team_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "owner_id" "uuid",
    "role" "text" DEFAULT 'assistant'::"text",
    "is_registered" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "type" "text",
    "category" "text",
    "date" "date" DEFAULT CURRENT_DATE,
    "wallet_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "payment_method" "text",
    "project_id" "uuid",
    "service_id" "uuid",
    "assistant_id" "uuid",
    "net_amount" numeric DEFAULT 0,
    "status" "text" DEFAULT 'completed'::"text",
    CONSTRAINT "transactions_type_check" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "badge_id" "text",
    "unlocked_at" timestamp with time zone DEFAULT "now"(),
    "is_new" boolean DEFAULT true,
    "seen_at" timestamp with time zone
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_ai_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "provider" "text" DEFAULT 'openai'::"text" NOT NULL,
    "api_key" "text",
    "model_name" "text" DEFAULT 'gpt-4o-mini'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_ai_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "provider" "text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_onboarding" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "current_step" "text" DEFAULT 'welcome'::"text",
    "completed_steps" "text"[] DEFAULT ARRAY[]::"text"[],
    "is_completed" boolean DEFAULT false,
    "has_seen_tour" boolean DEFAULT false,
    "tour_step" integer DEFAULT 0,
    "unlocked_badges" "text"[] DEFAULT ARRAY[]::"text"[],
    "business_info_completed" boolean DEFAULT false,
    "first_client_added" boolean DEFAULT false,
    "first_event_created" boolean DEFAULT false,
    "first_contract_generated" boolean DEFAULT false,
    "calendar_synced" boolean DEFAULT false,
    "profile_customized" boolean DEFAULT false,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_onboarding" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_seen_tips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "tip_id" "uuid",
    "seen_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_seen_tips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "balance" numeric(15,2) DEFAULT 0.00,
    "type" "text",
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "wallets_type_check" CHECK (("type" = ANY (ARRAY['checking'::"text", 'investment'::"text", 'cash'::"text", 'savings'::"text"])))
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wedding_clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text",
    "email" "text",
    "phone" "text",
    "user_id" "uuid",
    "wedding_date" timestamp with time zone,
    "secret_code" "text",
    "bride_status" boolean DEFAULT false,
    "moodboard_url" "text",
    "notes" "text",
    "full_name" "text",
    "instagram" "text",
    "origin" "text",
    "avatar_url" "text",
    "status" "text" DEFAULT 'active'::"text",
    "assistant_commission" "text",
    "parent_user_id" "text",
    "is_bride" boolean DEFAULT false,
    "access_pin" "text",
    "portal_link" "text",
    "cpf" "text",
    "address" "text",
    "last_visit" timestamp with time zone DEFAULT "now"(),
    "email_status" "text" DEFAULT 'verified'::"text",
    "contract_url" "text"
);


ALTER TABLE "public"."wedding_clients" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_badge_id_key" UNIQUE ("badge_id");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_logs"
    ADD CONSTRAINT "analytics_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistant_access"
    ADD CONSTRAINT "assistant_access_assistant_id_makeup_artist_id_status_key" UNIQUE ("assistant_id", "makeup_artist_id", "status");



ALTER TABLE ONLY "public"."assistant_access"
    ADD CONSTRAINT "assistant_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistant_invites"
    ADD CONSTRAINT "assistant_invites_invite_token_key" UNIQUE ("invite_token");



ALTER TABLE ONLY "public"."assistant_invites"
    ADD CONSTRAINT "assistant_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistant_notifications"
    ADD CONSTRAINT "assistant_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistants_legacy"
    ADD CONSTRAINT "assistants_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."assistants_legacy"
    ADD CONSTRAINT "assistants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."backup_integrity_logs"
    ADD CONSTRAINT "backup_integrity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bride_access"
    ADD CONSTRAINT "bride_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."briefings"
    ADD CONSTRAINT "briefings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_history"
    ADD CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contextual_tips"
    ADD CONSTRAINT "contextual_tips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_assistants"
    ADD CONSTRAINT "event_assistants_pkey" PRIMARY KEY ("event_id", "assistant_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_overview"
    ADD CONSTRAINT "financial_overview_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_calendar_tokens"
    ADD CONSTRAINT "google_calendar_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_calendar_tokens"
    ADD CONSTRAINT "google_calendar_tokens_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."instagram_connections"
    ADD CONSTRAINT "instagram_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_connections"
    ADD CONSTRAINT "instagram_connections_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."instagram_hashtag_suggestions"
    ADD CONSTRAINT "instagram_hashtag_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_messages"
    ADD CONSTRAINT "instagram_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_post_templates"
    ADD CONSTRAINT "instagram_post_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_posts"
    ADD CONSTRAINT "instagram_posts_instagram_media_id_key" UNIQUE ("instagram_media_id");



ALTER TABLE ONLY "public"."instagram_posts"
    ADD CONSTRAINT "instagram_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_scheduled_posts"
    ADD CONSTRAINT "instagram_scheduled_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_base"
    ADD CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_interactions"
    ADD CONSTRAINT "lead_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_stage_history"
    ADD CONSTRAINT "lead_stage_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_tasks"
    ADD CONSTRAINT "lead_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."makeup_artists"
    ADD CONSTRAINT "makeup_artists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."makeup_artists"
    ADD CONSTRAINT "makeup_artists_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."marketing_campaigns"
    ADD CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_user_id_type_key" UNIQUE ("user_id", "type");



ALTER TABLE ONLY "public"."moodboard_images"
    ADD CONSTRAINT "moodboard_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_custom_fields"
    ADD CONSTRAINT "pipeline_custom_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_limits"
    ADD CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("plan_type");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."project_services"
    ADD CONSTRAINT "project_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_mp_subscription_id_key" UNIQUE ("mp_subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."sync_conflicts"
    ADD CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sync_log"
    ADD CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_logs"
    ADD CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_invites"
    ADD CONSTRAINT "team_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_badge_id_key" UNIQUE ("user_id", "badge_id");



ALTER TABLE ONLY "public"."user_ai_settings"
    ADD CONSTRAINT "user_ai_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_ai_settings"
    ADD CONSTRAINT "user_ai_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."user_onboarding"
    ADD CONSTRAINT "user_onboarding_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_onboarding"
    ADD CONSTRAINT "user_onboarding_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role");



ALTER TABLE ONLY "public"."user_seen_tips"
    ADD CONSTRAINT "user_seen_tips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_seen_tips"
    ADD CONSTRAINT "user_seen_tips_user_id_tip_id_key" UNIQUE ("user_id", "tip_id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wedding_clients"
    ADD CONSTRAINT "wedding_clients_pkey" PRIMARY KEY ("id");



CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "audit_logs_table_name_idx" ON "public"."audit_logs" USING "btree" ("table_name");



CREATE INDEX "audit_logs_user_id_idx" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "contextual_tips_path_active_idx" ON "public"."contextual_tips" USING "btree" ("page_path", "is_active");



CREATE INDEX "idx_analytics_client_id" ON "public"."analytics_logs" USING "btree" ("client_id");



CREATE INDEX "idx_appointments_assistant_id" ON "public"."appointments" USING "btree" ("assistant_id");



CREATE INDEX "idx_appointments_client_id" ON "public"."appointments" USING "btree" ("client_id");



CREATE INDEX "idx_appointments_user_id" ON "public"."appointments" USING "btree" ("user_id");



CREATE INDEX "idx_assist_notif_user_id" ON "public"."assistant_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_assistant_access_assistant" ON "public"."assistant_access" USING "btree" ("assistant_id");



CREATE INDEX "idx_assistant_access_assistant_id" ON "public"."assistant_access" USING "btree" ("assistant_id");



CREATE INDEX "idx_assistant_access_makeup_artist" ON "public"."assistant_access" USING "btree" ("makeup_artist_id");



CREATE INDEX "idx_assistant_access_makeup_artist_id" ON "public"."assistant_access" USING "btree" ("makeup_artist_id");



CREATE INDEX "idx_assistant_invites_email" ON "public"."assistant_invites" USING "btree" ("assistant_email");



CREATE INDEX "idx_assistant_invites_email_status" ON "public"."assistant_invites" USING "btree" ("assistant_email", "email_status");



CREATE INDEX "idx_assistant_invites_invite_token" ON "public"."assistant_invites" USING "btree" ("invite_token");



CREATE INDEX "idx_assistant_invites_makeup_artist_id" ON "public"."assistant_invites" USING "btree" ("makeup_artist_id");



CREATE INDEX "idx_assistant_invites_token" ON "public"."assistant_invites" USING "btree" ("invite_token");



CREATE INDEX "idx_assistants_user_id" ON "public"."assistants_legacy" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_table_record" ON "public"."audit_logs" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_backup_logs_user_id" ON "public"."backup_integrity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_bride_acc_prof" ON "public"."bride_access" USING "btree" ("professional_id");



CREATE INDEX "idx_briefings_project_id" ON "public"."briefings" USING "btree" ("project_id");



CREATE INDEX "idx_briefings_user_id" ON "public"."briefings" USING "btree" ("user_id");



CREATE INDEX "idx_calendar_events_google_id" ON "public"."calendar_events" USING "btree" ("google_event_id");



CREATE UNIQUE INDEX "idx_calendar_events_google_unique" ON "public"."calendar_events" USING "btree" ("user_id", "google_event_id") WHERE ("google_event_id" IS NOT NULL);



CREATE INDEX "idx_calendar_events_project" ON "public"."calendar_events" USING "btree" ("project_id");



CREATE INDEX "idx_calendar_events_time" ON "public"."calendar_events" USING "btree" ("start_time", "end_time");



CREATE INDEX "idx_calendar_events_user" ON "public"."calendar_events" USING "btree" ("user_id");



CREATE INDEX "idx_contracts_client_id" ON "public"."contracts" USING "btree" ("client_id");



CREATE INDEX "idx_contracts_project_id" ON "public"."contracts" USING "btree" ("project_id");



CREATE INDEX "idx_contracts_user_id" ON "public"."contracts" USING "btree" ("user_id");



CREATE INDEX "idx_event_assist_assist_id" ON "public"."event_assistants" USING "btree" ("assistant_id");



CREATE INDEX "idx_event_assistants_assistant_id" ON "public"."event_assistants" USING "btree" ("assistant_id");



CREATE INDEX "idx_event_assistants_event_id" ON "public"."event_assistants" USING "btree" ("event_id");



CREATE INDEX "idx_events_assistant_id" ON "public"."events" USING "btree" ("assistant_id");



CREATE INDEX "idx_events_client" ON "public"."events" USING "btree" ("client_id");



CREATE INDEX "idx_events_event_date" ON "public"."events" USING "btree" ("event_date");



CREATE INDEX "idx_events_user_id" ON "public"."events" USING "btree" ("user_id");



CREATE INDEX "idx_gcal_tokens_expiry" ON "public"."google_calendar_tokens" USING "btree" ("channel_expiry");



CREATE INDEX "idx_gcal_tokens_user" ON "public"."google_calendar_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_invoices_project_id" ON "public"."invoices" USING "btree" ("project_id");



CREATE INDEX "idx_invoices_user_id" ON "public"."invoices" USING "btree" ("user_id");



CREATE INDEX "idx_leads_email_status" ON "public"."leads" USING "btree" ("email", "email_status");



CREATE INDEX "idx_leads_user_id" ON "public"."leads" USING "btree" ("user_id");



CREATE INDEX "idx_makeup_artists_plan" ON "public"."makeup_artists" USING "btree" ("plan_type", "plan_status");



CREATE INDEX "idx_marketing_user_id" ON "public"."marketing_campaigns" USING "btree" ("user_id");



CREATE INDEX "idx_moodboard_project_id" ON "public"."moodboard_images" USING "btree" ("project_id");



CREATE INDEX "idx_moodboard_user_id" ON "public"."moodboard_images" USING "btree" ("user_id");



CREATE INDEX "idx_notif_logs_notif" ON "public"."notification_logs" USING "btree" ("notification_id");



CREATE INDEX "idx_payouts_user_id" ON "public"."payouts" USING "btree" ("user_id");



CREATE INDEX "idx_prof_parent" ON "public"."profiles" USING "btree" ("parent_user_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_parent_user_id" ON "public"."profiles" USING "btree" ("parent_user_id");



CREATE INDEX "idx_profiles_stripe_cust_id" ON "public"."profiles" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_proj_services_proj_id" ON "public"."project_services" USING "btree" ("project_id");



CREATE INDEX "idx_proj_services_service_id" ON "public"."project_services" USING "btree" ("service_id");



CREATE INDEX "idx_projects_client_id" ON "public"."projects" USING "btree" ("client_id");



CREATE INDEX "idx_projects_user_id" ON "public"."projects" USING "btree" ("user_id");



CREATE INDEX "idx_serv_user" ON "public"."services" USING "btree" ("user_id");



CREATE INDEX "idx_services_user_id" ON "public"."services" USING "btree" ("user_id");



CREATE INDEX "idx_subscriptions_stripe_cust_id" ON "public"."subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_subscriptions_stripe_sub_id" ON "public"."subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_sync_conflicts_event_resolved" ON "public"."sync_conflicts" USING "btree" ("event_id", "resolved");



CREATE INDEX "idx_sync_log_user_time" ON "public"."sync_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_system_logs_user_id" ON "public"."system_logs" USING "btree" ("user_id");



CREATE INDEX "idx_tasks_project_id" ON "public"."tasks" USING "btree" ("project_id");



CREATE INDEX "idx_tasks_user_id" ON "public"."tasks" USING "btree" ("user_id");



CREATE INDEX "idx_team_invites_created_by" ON "public"."team_invites" USING "btree" ("created_by");



CREATE INDEX "idx_team_mem_owner" ON "public"."team_members" USING "btree" ("owner_id");



CREATE INDEX "idx_team_members_user_id" ON "public"."team_members" USING "btree" ("user_id");



CREATE INDEX "idx_trans_assist" ON "public"."transactions" USING "btree" ("assistant_id");



CREATE INDEX "idx_trans_serv" ON "public"."transactions" USING "btree" ("service_id");



CREATE INDEX "idx_transactions_project_id" ON "public"."transactions" USING "btree" ("project_id");



CREATE INDEX "idx_transactions_user_id" ON "public"."transactions" USING "btree" ("user_id");



CREATE INDEX "idx_transactions_wallet_id" ON "public"."transactions" USING "btree" ("wallet_id");



CREATE INDEX "idx_wallets_user_id" ON "public"."wallets" USING "btree" ("user_id");



CREATE INDEX "idx_wedding_clients_email" ON "public"."wedding_clients" USING "btree" ("email");



CREATE INDEX "idx_wedding_clients_is_bride" ON "public"."wedding_clients" USING "btree" ("is_bride") WHERE ("is_bride" = true);



CREATE INDEX "idx_wedding_clients_user_id" ON "public"."wedding_clients" USING "btree" ("user_id");



CREATE INDEX "instagram_connections_user_connected_idx" ON "public"."instagram_connections" USING "btree" ("user_id", "is_connected");



CREATE INDEX "instagram_messages_connection_read_idx" ON "public"."instagram_messages" USING "btree" ("instagram_connection_id", "is_read");



CREATE INDEX "instagram_messages_conversation_idx" ON "public"."instagram_messages" USING "btree" ("conversation_id", "message_timestamp" DESC);



CREATE INDEX "instagram_posts_connection_time_idx" ON "public"."instagram_posts" USING "btree" ("instagram_connection_id", "timestamp" DESC);



CREATE INDEX "instagram_scheduled_posts_user_status_idx" ON "public"."instagram_scheduled_posts" USING "btree" ("user_id", "status", "scheduled_for");



CREATE INDEX "knowledge_base_embedding_idx" ON "public"."knowledge_base" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "lead_interactions_lead_created_idx" ON "public"."lead_interactions" USING "btree" ("lead_id", "created_at" DESC);



CREATE INDEX "lead_stage_history_lead_moved_idx" ON "public"."lead_stage_history" USING "btree" ("lead_id", "moved_at" DESC);



CREATE INDEX "lead_tasks_assigned_completed_idx" ON "public"."lead_tasks" USING "btree" ("assigned_to", "is_completed");



CREATE INDEX "lead_tasks_lead_completed_due_idx" ON "public"."lead_tasks" USING "btree" ("lead_id", "is_completed", "due_date");



CREATE INDEX "leads_event_date_idx" ON "public"."leads" USING "btree" ("event_date") WHERE ("event_date" IS NOT NULL);



CREATE INDEX "leads_score_idx" ON "public"."leads" USING "btree" ("lead_score" DESC);



CREATE INDEX "leads_user_status_stage_idx" ON "public"."leads" USING "btree" ("user_id", "status", "current_stage_id");



CREATE INDEX "user_achievements_user_new_idx" ON "public"."user_achievements" USING "btree" ("user_id", "is_new");



CREATE INDEX "user_onboarding_user_completed_idx" ON "public"."user_onboarding" USING "btree" ("user_id", "is_completed");



CREATE OR REPLACE TRIGGER "after_client_insert" AFTER INSERT ON "public"."wedding_clients" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_check_achievements"();



CREATE OR REPLACE TRIGGER "after_project_insert" AFTER INSERT ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_check_achievements"();



CREATE OR REPLACE TRIGGER "audit_calendar_events_delete" AFTER DELETE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_calendar_events_insert" AFTER INSERT ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_calendar_events_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_calendar_events_update" AFTER UPDATE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_gcal_tokens_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."google_calendar_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_google_calendar_tokens_delete" AFTER DELETE ON "public"."google_calendar_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_google_calendar_tokens_insert" AFTER INSERT ON "public"."google_calendar_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_google_calendar_tokens_update" AFTER UPDATE ON "public"."google_calendar_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_trigger_delete" AFTER DELETE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_trigger_delete" AFTER DELETE ON "public"."google_calendar_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_trigger_delete" AFTER DELETE ON "public"."sync_conflicts" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_trigger_insert" AFTER INSERT ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_trigger_insert" AFTER INSERT ON "public"."google_calendar_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_trigger_insert" AFTER INSERT ON "public"."sync_conflicts" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_trigger_update" AFTER UPDATE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_trigger_update" AFTER UPDATE ON "public"."google_calendar_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "audit_trigger_update" AFTER UPDATE ON "public"."sync_conflicts" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "before_lead_update" BEFORE INSERT OR UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_recalculate_lead_score"();



CREATE OR REPLACE TRIGGER "on_invoice_paid_feedback" AFTER UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."handle_invoice_paid_feedback"();



CREATE OR REPLACE TRIGGER "on_project_status_tracking" AFTER UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."handle_project_tracking"();



CREATE OR REPLACE TRIGGER "tr_audit_contracts" AFTER INSERT OR DELETE OR UPDATE ON "public"."contracts" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_invoices" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_leads" AFTER INSERT OR DELETE OR UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_message_templates" AFTER INSERT OR DELETE OR UPDATE ON "public"."message_templates" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_profiles" AFTER INSERT OR DELETE OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_project_services" AFTER INSERT OR DELETE OR UPDATE ON "public"."project_services" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_projects" AFTER INSERT OR DELETE OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_services" AFTER INSERT OR DELETE OR UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_system_config" AFTER INSERT OR DELETE OR UPDATE ON "public"."system_config" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_team_invites" AFTER INSERT OR DELETE OR UPDATE ON "public"."team_invites" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_team_members" AFTER INSERT OR DELETE OR UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_transactions" AFTER INSERT OR DELETE OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_wallets" AFTER INSERT OR DELETE OR UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "tr_audit_wedding_clients" AFTER INSERT OR DELETE OR UPDATE ON "public"."wedding_clients" FOR EACH ROW EXECUTE FUNCTION "public"."process_audit_log"();



CREATE OR REPLACE TRIGGER "track_stage_changes" AFTER UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_log_stage_change"();



CREATE OR REPLACE TRIGGER "update_leads_modtime" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



ALTER TABLE ONLY "public"."analytics_logs"
    ADD CONSTRAINT "analytics_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."wedding_clients"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."assistant_access"
    ADD CONSTRAINT "assistant_access_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."assistants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistant_access"
    ADD CONSTRAINT "assistant_access_makeup_artist_id_fkey" FOREIGN KEY ("makeup_artist_id") REFERENCES "public"."makeup_artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistant_invites"
    ADD CONSTRAINT "assistant_invites_makeup_artist_id_fkey" FOREIGN KEY ("makeup_artist_id") REFERENCES "public"."makeup_artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistant_notifications"
    ADD CONSTRAINT "assistant_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_assistants"
    ADD CONSTRAINT "assistants" FOREIGN KEY ("assistant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistants_legacy"
    ADD CONSTRAINT "assistants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."backup_integrity_logs"
    ADD CONSTRAINT "backup_integrity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bride_access"
    ADD CONSTRAINT "bride_access_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."briefings"
    ADD CONSTRAINT "briefings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."briefings"
    ADD CONSTRAINT "briefings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_history"
    ADD CONSTRAINT "chat_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."wedding_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_assistants"
    ADD CONSTRAINT "event_assistants_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_assistants"
    ADD CONSTRAINT "event_assistants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "event_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."wedding_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."google_calendar_tokens"
    ADD CONSTRAINT "google_calendar_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instagram_connections"
    ADD CONSTRAINT "instagram_connections_makeup_artist_id_fkey" FOREIGN KEY ("makeup_artist_id") REFERENCES "public"."makeup_artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instagram_connections"
    ADD CONSTRAINT "instagram_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instagram_hashtag_suggestions"
    ADD CONSTRAINT "instagram_hashtag_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instagram_messages"
    ADD CONSTRAINT "instagram_messages_instagram_connection_id_fkey" FOREIGN KEY ("instagram_connection_id") REFERENCES "public"."instagram_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instagram_post_templates"
    ADD CONSTRAINT "instagram_post_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instagram_posts"
    ADD CONSTRAINT "instagram_posts_instagram_connection_id_fkey" FOREIGN KEY ("instagram_connection_id") REFERENCES "public"."instagram_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instagram_posts"
    ADD CONSTRAINT "instagram_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instagram_scheduled_posts"
    ADD CONSTRAINT "instagram_scheduled_posts_instagram_connection_id_fkey" FOREIGN KEY ("instagram_connection_id") REFERENCES "public"."instagram_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instagram_scheduled_posts"
    ADD CONSTRAINT "instagram_scheduled_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_interactions"
    ADD CONSTRAINT "lead_interactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lead_interactions"
    ADD CONSTRAINT "lead_interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_stage_history"
    ADD CONSTRAINT "lead_stage_history_from_stage_id_fkey" FOREIGN KEY ("from_stage_id") REFERENCES "public"."pipeline_stages"("id");



ALTER TABLE ONLY "public"."lead_stage_history"
    ADD CONSTRAINT "lead_stage_history_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_stage_history"
    ADD CONSTRAINT "lead_stage_history_moved_by_fkey" FOREIGN KEY ("moved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lead_stage_history"
    ADD CONSTRAINT "lead_stage_history_to_stage_id_fkey" FOREIGN KEY ("to_stage_id") REFERENCES "public"."pipeline_stages"("id");



ALTER TABLE ONLY "public"."lead_tasks"
    ADD CONSTRAINT "lead_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lead_tasks"
    ADD CONSTRAINT "lead_tasks_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lead_tasks"
    ADD CONSTRAINT "lead_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_converted_to_client_id_fkey" FOREIGN KEY ("converted_to_client_id") REFERENCES "public"."wedding_clients"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_converted_to_project_id_fkey" FOREIGN KEY ("converted_to_project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "public"."pipeline_stages"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."makeup_artists"
    ADD CONSTRAINT "makeup_artists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketing_campaigns"
    ADD CONSTRAINT "marketing_campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_templates"
    ADD CONSTRAINT "message_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."moodboard_images"
    ADD CONSTRAINT "moodboard_images_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moodboard_images"
    ADD CONSTRAINT "moodboard_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."assistant_notifications"("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pipeline_custom_fields"
    ADD CONSTRAINT "pipeline_custom_fields_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_stages"
    ADD CONSTRAINT "pipeline_stages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_parent_user_id_fkey" FOREIGN KEY ("parent_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_services"
    ADD CONSTRAINT "project_services_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_services"
    ADD CONSTRAINT "project_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sync_conflicts"
    ADD CONSTRAINT "sync_conflicts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sync_log"
    ADD CONSTRAINT "sync_log_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sync_log"
    ADD CONSTRAINT "sync_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_logs"
    ADD CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_invites"
    ADD CONSTRAINT "team_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."achievements"("badge_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_ai_settings"
    ADD CONSTRAINT "user_ai_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_onboarding"
    ADD CONSTRAINT "user_onboarding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_seen_tips"
    ADD CONSTRAINT "user_seen_tips_tip_id_fkey" FOREIGN KEY ("tip_id") REFERENCES "public"."contextual_tips"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_seen_tips"
    ADD CONSTRAINT "user_seen_tips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "wedding_clients" FOREIGN KEY ("client_id") REFERENCES "public"."wedding_clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wedding_clients"
    ADD CONSTRAINT "wedding_clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Acesso Total" ON "public"."wedding_clients" USING (true) WITH CHECK (true);



CREATE POLICY "Admin pode gerenciar perfis" ON "public"."profiles" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Admins can insert system config" ON "public"."system_config" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all transactions" ON "public"."transactions" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage payouts" ON "public"."payouts" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage system config" ON "public"."system_config" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update system config" ON "public"."system_config" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Admins can view all audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can view all data" ON "public"."projects" FOR SELECT USING (((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")));



CREATE POLICY "Admins can view notification logs" ON "public"."notification_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Allow anonymous read for portal" ON "public"."wedding_clients" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Assistants can manage own profile" ON "public"."assistants" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Assistants can view assigned appointments" ON "public"."appointments" FOR SELECT USING ((("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))) AND (( SELECT "makeup_artists"."id"
   FROM "public"."makeup_artists"
  WHERE ("makeup_artists"."user_id" = "appointments"."user_id")) IN ( SELECT "assistant_access"."makeup_artist_id"
   FROM "public"."assistant_access"
  WHERE (("assistant_access"."assistant_id" = ( SELECT "assistants"."id"
           FROM "public"."assistants"
          WHERE ("assistants"."user_id" = "auth"."uid"()))) AND ("assistant_access"."status" = 'active'::"text"))))));



CREATE POLICY "Assistants can view invites sent to them" ON "public"."assistant_invites" FOR SELECT USING (("assistant_email" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = "auth"."uid"())))::"text"));



CREATE POLICY "Assistants can view their connections" ON "public"."assistant_access" FOR SELECT USING (("assistant_id" IN ( SELECT "assistants"."id"
   FROM "public"."assistants"
  WHERE ("assistants"."user_id" = "auth"."uid"()))));



CREATE POLICY "Boss can view employee profiles" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "parent_user_id"));



CREATE POLICY "Criação de perfil" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Employers can view their assistants" ON "public"."assistants" FOR SELECT USING (("id" IN ( SELECT "assistant_access"."assistant_id"
   FROM "public"."assistant_access"
  WHERE (("assistant_access"."makeup_artist_id" IN ( SELECT "makeup_artists"."id"
           FROM "public"."makeup_artists"
          WHERE ("makeup_artists"."user_id" = "auth"."uid"()))) AND ("assistant_access"."status" = 'active'::"text")))));



CREATE POLICY "Enable insert for authenticated users" ON "public"."audit_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Leitura pública" ON "public"."system_config" FOR SELECT USING (true);



CREATE POLICY "Leitura pública de serviços" ON "public"."services" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Leitura pública project_services" ON "public"."project_services" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Leitura_Publica_Portal_Eventos" ON "public"."events" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Leitura_Publica_Portal_Profiles" ON "public"."profiles" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Leitura_Publica_Portal_Projetos" ON "public"."projects" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Makeup artists can create invites" ON "public"."assistant_invites" FOR INSERT WITH CHECK (("makeup_artist_id" IN ( SELECT "makeup_artists"."id"
   FROM "public"."makeup_artists"
  WHERE ("makeup_artists"."user_id" = "auth"."uid"()))));



CREATE POLICY "Makeup artists can insert invites" ON "public"."assistant_invites" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "makeup_artists"."user_id"
   FROM "public"."makeup_artists"
  WHERE ("makeup_artists"."id" = "assistant_invites"."makeup_artist_id"))));



CREATE POLICY "Makeup artists can revoke access" ON "public"."assistant_access" FOR UPDATE USING (("makeup_artist_id" IN ( SELECT "makeup_artists"."id"
   FROM "public"."makeup_artists"
  WHERE ("makeup_artists"."user_id" = "auth"."uid"()))));



CREATE POLICY "Makeup artists can update own profile" ON "public"."makeup_artists" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Makeup artists can view own invites" ON "public"."assistant_invites" FOR SELECT USING (("makeup_artist_id" IN ( SELECT "makeup_artists"."id"
   FROM "public"."makeup_artists"
  WHERE ("makeup_artists"."user_id" = "auth"."uid"()))));



CREATE POLICY "Makeup artists can view own profile" ON "public"."makeup_artists" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Makeup artists can view their assistants" ON "public"."assistant_access" FOR SELECT USING (("makeup_artist_id" IN ( SELECT "makeup_artists"."id"
   FROM "public"."makeup_artists"
  WHERE ("makeup_artists"."user_id" = "auth"."uid"()))));



CREATE POLICY "Makeup artists can view their own invites" ON "public"."assistant_invites" FOR SELECT USING (("auth"."uid"() IN ( SELECT "makeup_artists"."user_id"
   FROM "public"."makeup_artists"
  WHERE ("makeup_artists"."id" = "assistant_invites"."makeup_artist_id"))));



CREATE POLICY "Noivas podem ver suas próprias receitas" ON "public"."transactions" FOR SELECT TO "anon" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects")));



CREATE POLICY "Permitir update de onboarding" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Portal_Read_Project_Services" ON "public"."project_services" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Portal_Read_Services" ON "public"."services" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Portal_Read_Transactions" ON "public"."transactions" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Pros can manage their bride links" ON "public"."bride_access" USING (("auth"."uid"() = "professional_id"));



CREATE POLICY "Public Profiles Access" ON "public"."profiles" FOR SELECT USING (("slug" IS NOT NULL));



CREATE POLICY "Public Services Access" ON "public"."services" FOR SELECT USING (true);



CREATE POLICY "Public can view knowledge base" ON "public"."knowledge_base" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public profiles read access" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public read access to plan limits" ON "public"."plan_limits" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public read config" ON "public"."system_config" FOR SELECT USING (true);



CREATE POLICY "Service role can delete knowledge base" ON "public"."knowledge_base" FOR DELETE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can insert knowledge base" ON "public"."knowledge_base" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can update knowledge base" ON "public"."knowledge_base" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Simple Insert" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Simple Update" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can create assistants" ON "public"."assistants_legacy" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create events" ON "public"."events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own contracts" ON "public"."contracts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own assistants" ON "public"."assistants_legacy" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own profile" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete own projects" ON "public"."projects" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own contracts" ON "public"."contracts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert analytics" ON "public"."analytics_logs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert backup logs" ON "public"."backup_integrity_logs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert into their own chat history" ON "public"."chat_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert notification logs" ON "public"."notification_logs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "Users can insert own projects" ON "public"."projects" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own services" ON "public"."services" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own subscription" ON "public"."subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert projects" ON "public"."projects" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert system logs" ON "public"."system_logs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can insert their own conflicts" ON "public"."sync_conflicts" FOR INSERT WITH CHECK (("event_id" IN ( SELECT "calendar_events"."id"
   FROM "public"."calendar_events"
  WHERE ("calendar_events"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage assistants for their events" ON "public"."event_assistants" USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_assistants"."event_id") AND ("events"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage lead interactions" ON "public"."lead_interactions" USING (("lead_id" IN ( SELECT "leads"."id"
   FROM "public"."leads"
  WHERE ("leads"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage lead tasks" ON "public"."lead_tasks" USING ((("lead_id" IN ( SELECT "leads"."id"
   FROM "public"."leads"
  WHERE ("leads"."user_id" = "auth"."uid"()))) OR ("assigned_to" = "auth"."uid"())));



CREATE POLICY "Users can manage notifications" ON "public"."assistant_notifications" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own ai settings" ON "public"."user_ai_settings" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own assistants" ON "public"."assistants_legacy" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own briefings" ON "public"."briefings" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own contracts" ON "public"."contracts" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "projects"."user_id"
   FROM "public"."projects"
  WHERE ("projects"."id" = "contracts"."project_id"))));



CREATE POLICY "Users can manage own events" ON "public"."calendar_events" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own events" ON "public"."events" USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "projects"."user_id"
   FROM "public"."projects"
  WHERE ("projects"."id" = "events"."project_id"))));



CREATE POLICY "Users can manage own hashtag suggestions" ON "public"."instagram_hashtag_suggestions" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own instagram connection" ON "public"."instagram_connections" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own integrations" ON "public"."user_integrations" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own invoices" ON "public"."invoices" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own leads" ON "public"."leads" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own messages" ON "public"."instagram_messages" USING (("instagram_connection_id" IN ( SELECT "instagram_connections"."id"
   FROM "public"."instagram_connections"
  WHERE ("instagram_connections"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage own moodboard images" ON "public"."moodboard_images" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own onboarding" ON "public"."user_onboarding" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own pipeline" ON "public"."pipeline_stages" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own post templates" ON "public"."instagram_post_templates" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own scheduled posts" ON "public"."instagram_scheduled_posts" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own services" ON "public"."services" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own tasks" ON "public"."tasks" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own tips" ON "public"."user_seen_tips" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own tokens" ON "public"."google_calendar_tokens" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own transactions" ON "public"."transactions" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their assistants" ON "public"."assistants_legacy" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own marketing" ON "public"."marketing_campaigns" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own templates" ON "public"."message_templates" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only access their own appointments" ON "public"."appointments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only access their own profile" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can only see their own clients" ON "public"."wedding_clients" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own roles" ON "public"."user_roles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "Users can update own profile onboarding" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own projects" ON "public"."projects" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own subscription" ON "public"."subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own conflicts" ON "public"."sync_conflicts" FOR UPDATE USING (("event_id" IN ( SELECT "calendar_events"."id"
   FROM "public"."calendar_events"
  WHERE ("calendar_events"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own contracts" ON "public"."contracts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view assistants for their events" ON "public"."event_assistants" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_assistants"."event_id") AND ("events"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own achievements" ON "public"."user_achievements" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own clients" ON "public"."wedding_clients" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own lead history" ON "public"."lead_stage_history" FOR SELECT USING (("lead_id" IN ( SELECT "leads"."id"
   FROM "public"."leads"
  WHERE ("leads"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own payouts" ON "public"."payouts" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own posts analytics" ON "public"."instagram_posts" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own projects" ON "public"."projects" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own subscription" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own wallet" ON "public"."wallets" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view templates from their organization" ON "public"."message_templates" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("organization_id" IS NOT NULL)));



CREATE POLICY "Users can view their own audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own chat history" ON "public"."chat_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own conflicts" ON "public"."sync_conflicts" FOR SELECT USING (("event_id" IN ( SELECT "calendar_events"."id"
   FROM "public"."calendar_events"
  WHERE ("calendar_events"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own contracts" ON "public"."contracts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own contracts" ON "public"."contracts" USING (((( SELECT "auth"."uid"() AS "uid"))::"text" IN ( SELECT ("projects"."user_id")::"text" AS "user_id"
   FROM "public"."projects"
  WHERE ("projects"."id" = "contracts"."project_id"))));



CREATE POLICY "Users manage own events" ON "public"."events" USING (((( SELECT "auth"."uid"() AS "uid"))::"text" IN ( SELECT ("projects"."user_id")::"text" AS "user_id"
   FROM "public"."projects"
  WHERE ("projects"."id" = "events"."project_id"))));



CREATE POLICY "Users manage own integrations" ON "public"."user_integrations" USING ((("user_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "Users manage own invites" ON "public"."team_invites" USING ((("created_by")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "Users manage own projects" ON "public"."projects" USING ((("user_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "Users manage own team members" ON "public"."team_members" USING ((("user_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "Users manage own transactions" ON "public"."transactions" USING ((("user_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "Users manage project services" ON "public"."project_services" USING (("user_id" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "Users view own project services" ON "public"."project_services" FOR SELECT USING (("user_id" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "Usuário edita próprio perfil" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistants_legacy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."backup_integrity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bride_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."briefings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contextual_tips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_assistants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_overview" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."google_calendar_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instagram_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instagram_hashtag_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instagram_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instagram_post_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instagram_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instagram_scheduled_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_base" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_stage_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."makeup_artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketing_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moodboard_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipeline_custom_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipeline_stages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sync_conflicts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sync_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_ai_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_onboarding" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_seen_tips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wedding_clients" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."accept_assistant_invite"("p_invite_token" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_assistant_invite"("p_invite_token" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_assistant_invite"("p_invite_token" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_engagement_rate"("p_likes" integer, "p_comments" integer, "p_saves" integer, "p_followers" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_engagement_rate"("p_likes" integer, "p_comments" integer, "p_saves" integer, "p_followers" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_engagement_rate"("p_likes" integer, "p_comments" integer, "p_saves" integer, "p_followers" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_unlock_achievements"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_unlock_achievements"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_unlock_achievements"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_assistant_exists"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_assistant_exists"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_assistant_exists"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_plan_limit"("p_user_id" "uuid", "p_feature" "text", "p_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_plan_limit"("p_user_id" "uuid", "p_feature" "text", "p_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_plan_limit"("p_user_id" "uuid", "p_feature" "text", "p_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_assistant_invite"("p_makeup_artist_id" "uuid", "p_assistant_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_assistant_invite"("p_makeup_artist_id" "uuid", "p_assistant_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_assistant_invite"("p_makeup_artist_id" "uuid", "p_assistant_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_pipeline_stages"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_pipeline_stages"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_pipeline_stages"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."enable_auditing"("table_name_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."enable_auditing"("table_name_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enable_auditing"("table_name_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_stage_automations"("p_lead_id" "uuid", "p_stage_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_stage_automations"("p_lead_id" "uuid", "p_stage_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_stage_automations"("p_lead_id" "uuid", "p_stage_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_old_invites"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_old_invites"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_old_invites"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_signature_hash"("p_signer_name" "text", "p_signer_email" "text", "p_signer_cpf" "text", "p_signature_data" "text", "p_contract_id" "uuid", "p_timestamp" timestamp with time zone, "p_ip_address" "text", "p_device_fingerprint" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_signature_hash"("p_signer_name" "text", "p_signer_email" "text", "p_signer_cpf" "text", "p_signature_data" "text", "p_contract_id" "uuid", "p_timestamp" timestamp with time zone, "p_ip_address" "text", "p_device_fingerprint" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_signature_hash"("p_signer_name" "text", "p_signer_email" "text", "p_signer_cpf" "text", "p_signature_data" "text", "p_contract_id" "uuid", "p_timestamp" timestamp with time zone, "p_ip_address" "text", "p_device_fingerprint" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid", "p_pin" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid", "p_pin" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid", "p_pin" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_required_plan"("p_feature" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_required_plan"("p_feature" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_required_plan"("p_feature" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_invoice_paid_feedback"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_invoice_paid_feedback"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_invoice_paid_feedback"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_project_tracking"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_project_tracking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_project_tracking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_knowledge"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."match_knowledge"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_knowledge"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_audit_log"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_audit_log"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_audit_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_instagram_token"("p_connection_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_instagram_token"("p_connection_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_instagram_token"("p_connection_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_templated_email"("recipient" "text", "template_name" "text", "template_data" "jsonb", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."send_templated_email"("recipient" "text", "template_name" "text", "template_data" "jsonb", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_templated_email"("recipient" "text", "template_name" "text", "template_data" "jsonb", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_check_achievements"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_check_achievements"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_check_achievements"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_log_stage_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_log_stage_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_log_stage_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_recalculate_lead_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_recalculate_lead_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_recalculate_lead_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_bride_pin"("client_id" "uuid", "pin_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_bride_pin"("client_id" "uuid", "pin_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_bride_pin"("client_id" "uuid", "pin_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";









GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_logs" TO "anon";
GRANT ALL ON TABLE "public"."analytics_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_logs" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_access" TO "anon";
GRANT ALL ON TABLE "public"."assistant_access" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_access" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_invites" TO "anon";
GRANT ALL ON TABLE "public"."assistant_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_invites" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_notifications" TO "anon";
GRANT ALL ON TABLE "public"."assistant_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."assistants" TO "anon";
GRANT ALL ON TABLE "public"."assistants" TO "authenticated";
GRANT ALL ON TABLE "public"."assistants" TO "service_role";



GRANT ALL ON TABLE "public"."assistants_legacy" TO "anon";
GRANT ALL ON TABLE "public"."assistants_legacy" TO "authenticated";
GRANT ALL ON TABLE "public"."assistants_legacy" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."backup_integrity_logs" TO "anon";
GRANT ALL ON TABLE "public"."backup_integrity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_integrity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."bride_access" TO "anon";
GRANT ALL ON TABLE "public"."bride_access" TO "authenticated";
GRANT ALL ON TABLE "public"."bride_access" TO "service_role";



GRANT ALL ON TABLE "public"."briefings" TO "anon";
GRANT ALL ON TABLE "public"."briefings" TO "authenticated";
GRANT ALL ON TABLE "public"."briefings" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";



GRANT ALL ON TABLE "public"."chat_history" TO "anon";
GRANT ALL ON TABLE "public"."chat_history" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_history" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("onboarding_completed") ON TABLE "public"."profiles" TO "authenticated";



GRANT SELECT("parent_user_id") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("google_calendar_connected") ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."contextual_tips" TO "anon";
GRANT ALL ON TABLE "public"."contextual_tips" TO "authenticated";
GRANT ALL ON TABLE "public"."contextual_tips" TO "service_role";



GRANT ALL ON TABLE "public"."contracts" TO "anon";
GRANT ALL ON TABLE "public"."contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."contracts" TO "service_role";



GRANT ALL ON TABLE "public"."event_assistants" TO "anon";
GRANT ALL ON TABLE "public"."event_assistants" TO "authenticated";
GRANT ALL ON TABLE "public"."event_assistants" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."financial_overview" TO "anon";
GRANT ALL ON TABLE "public"."financial_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_overview" TO "service_role";



GRANT ALL ON TABLE "public"."google_calendar_tokens" TO "anon";
GRANT ALL ON TABLE "public"."google_calendar_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."google_calendar_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_connections" TO "anon";
GRANT ALL ON TABLE "public"."instagram_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_connections" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_hashtag_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."instagram_hashtag_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_hashtag_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_messages" TO "anon";
GRANT ALL ON TABLE "public"."instagram_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_messages" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_post_templates" TO "anon";
GRANT ALL ON TABLE "public"."instagram_post_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_post_templates" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_posts" TO "anon";
GRANT ALL ON TABLE "public"."instagram_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_posts" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_scheduled_posts" TO "anon";
GRANT ALL ON TABLE "public"."instagram_scheduled_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_scheduled_posts" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_base" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_base" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_base" TO "service_role";



GRANT ALL ON TABLE "public"."lead_interactions" TO "anon";
GRANT ALL ON TABLE "public"."lead_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."lead_stage_history" TO "anon";
GRANT ALL ON TABLE "public"."lead_stage_history" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_stage_history" TO "service_role";



GRANT ALL ON TABLE "public"."lead_tasks" TO "anon";
GRANT ALL ON TABLE "public"."lead_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."makeup_artists" TO "anon";
GRANT ALL ON TABLE "public"."makeup_artists" TO "authenticated";
GRANT ALL ON TABLE "public"."makeup_artists" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."marketing_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."message_templates" TO "anon";
GRANT ALL ON TABLE "public"."message_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."message_templates" TO "service_role";



GRANT ALL ON TABLE "public"."moodboard_images" TO "anon";
GRANT ALL ON TABLE "public"."moodboard_images" TO "authenticated";
GRANT ALL ON TABLE "public"."moodboard_images" TO "service_role";



GRANT ALL ON TABLE "public"."notification_logs" TO "anon";
GRANT ALL ON TABLE "public"."notification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_logs" TO "service_role";



GRANT ALL ON TABLE "public"."payouts" TO "anon";
GRANT ALL ON TABLE "public"."payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."payouts" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_custom_fields" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_custom_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_custom_fields" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_stages" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_stages" TO "service_role";



GRANT ALL ON TABLE "public"."plan_limits" TO "anon";
GRANT ALL ON TABLE "public"."plan_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_limits" TO "service_role";



GRANT ALL ON TABLE "public"."project_services" TO "anon";
GRANT ALL ON TABLE "public"."project_services" TO "authenticated";
GRANT ALL ON TABLE "public"."project_services" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."sync_conflicts" TO "anon";
GRANT ALL ON TABLE "public"."sync_conflicts" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_conflicts" TO "service_role";



GRANT ALL ON TABLE "public"."sync_log" TO "anon";
GRANT ALL ON TABLE "public"."sync_log" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_log" TO "service_role";



GRANT ALL ON TABLE "public"."system_config" TO "anon";
GRANT ALL ON TABLE "public"."system_config" TO "authenticated";
GRANT ALL ON TABLE "public"."system_config" TO "service_role";



GRANT ALL ON TABLE "public"."system_logs" TO "anon";
GRANT ALL ON TABLE "public"."system_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."system_logs" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."team_invites" TO "anon";
GRANT ALL ON TABLE "public"."team_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."team_invites" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_ai_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_ai_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_ai_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_integrations" TO "anon";
GRANT ALL ON TABLE "public"."user_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."user_onboarding" TO "anon";
GRANT ALL ON TABLE "public"."user_onboarding" TO "authenticated";
GRANT ALL ON TABLE "public"."user_onboarding" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_seen_tips" TO "anon";
GRANT ALL ON TABLE "public"."user_seen_tips" TO "authenticated";
GRANT ALL ON TABLE "public"."user_seen_tips" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";



GRANT ALL ON TABLE "public"."wedding_clients" TO "anon";
GRANT ALL ON TABLE "public"."wedding_clients" TO "authenticated";
GRANT ALL ON TABLE "public"."wedding_clients" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































