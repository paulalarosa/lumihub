


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






CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'editor',
    'viewer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
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


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Cria o perfil na tabela profiles
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', 'Novo'),
    COALESCE(new.raw_user_meta_data->>'last_name', 'Usuário')
  );

  -- Cria o papel padrão na tabela user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');

  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_bride_pin"("client_id" "uuid", "pin_code" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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
    CONSTRAINT "appointments_event_type_check" CHECK (("event_type" = ANY (ARRAY['Noivas'::"text", 'Pré Wedding'::"text", 'Produções Sociais'::"text"])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


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


ALTER TABLE "public"."assistants" OWNER TO "postgres";


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
    "birth_date" "date"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."clients" AS
 SELECT "id",
    "first_name",
    "last_name",
    "email",
    "phone",
    "birth_date",
    "created_at"
   FROM "public"."profiles" "p";


ALTER VIEW "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients_backup_error" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text",
    "email" "text",
    "phone" "text",
    "user_id" "uuid",
    "wedding_date" timestamp with time zone,
    "secret_code" "text",
    "bride_status" boolean DEFAULT false,
    "moodboard_url" "text"
);


ALTER TABLE "public"."clients_backup_error" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients_bugada" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text",
    "email" "text",
    "phone" "text",
    "user_id" "uuid",
    "wedding_date" timestamp with time zone,
    "secret_code" "text",
    "bride_status" boolean DEFAULT false,
    "moodboard_url" "text"
);


ALTER TABLE "public"."clients_bugada" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients_old_broken" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text",
    "email" "text",
    "phone" "text",
    "wedding_date" timestamp with time zone,
    "secret_code" "text",
    "bride_status" boolean DEFAULT false,
    "moodboard_url" "text",
    "user_id" "uuid"
);


ALTER TABLE "public"."clients_old_broken" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "client_name" "text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text",
    "value" numeric,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


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
    "clients_1.cpf" "text",
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
    CONSTRAINT "transactions_type_check" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


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
    "last_visit" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wedding_clients" OWNER TO "postgres";


ALTER TABLE ONLY "public"."analytics_logs"
    ADD CONSTRAINT "analytics_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistant_notifications"
    ADD CONSTRAINT "assistant_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."backup_integrity_logs"
    ADD CONSTRAINT "backup_integrity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bride_access"
    ADD CONSTRAINT "bride_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."briefings"
    ADD CONSTRAINT "briefings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients_old_broken"
    ADD CONSTRAINT "clients_fix_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients_bugada"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients_backup_error"
    ADD CONSTRAINT "clients_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_assistants"
    ADD CONSTRAINT "event_assistants_pkey" PRIMARY KEY ("event_id", "assistant_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_overview"
    ADD CONSTRAINT "financial_overview_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."project_services"
    ADD CONSTRAINT "project_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wedding_clients"
    ADD CONSTRAINT "wedding_clients_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_assistants_invite_token" ON "public"."assistants" USING "btree" ("invite_token");



CREATE INDEX "idx_contracts_project_id" ON "public"."contracts" USING "btree" ("project_id");



CREATE INDEX "idx_events_client_id" ON "public"."events" USING "btree" ("client_id");



CREATE INDEX "idx_events_project_id" ON "public"."events" USING "btree" ("project_id");



CREATE INDEX "idx_projects_client_id" ON "public"."projects" USING "btree" ("client_id");



CREATE INDEX "idx_transactions_project_id" ON "public"."transactions" USING "btree" ("project_id");



CREATE OR REPLACE TRIGGER "update_leads_modtime" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



ALTER TABLE ONLY "public"."analytics_logs"
    ADD CONSTRAINT "analytics_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."wedding_clients"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."assistant_notifications"
    ADD CONSTRAINT "assistant_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_assistants"
    ADD CONSTRAINT "assistants" FOREIGN KEY ("assistant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assistants"
    ADD CONSTRAINT "assistants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."backup_integrity_logs"
    ADD CONSTRAINT "backup_integrity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bride_access"
    ADD CONSTRAINT "bride_access_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."briefings"
    ADD CONSTRAINT "briefings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."briefings"
    ADD CONSTRAINT "briefings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients_bugada"
    ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clients_backup_error"
    ADD CONSTRAINT "clients_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



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



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



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



ALTER TABLE ONLY "public"."user_integrations"
    ADD CONSTRAINT "user_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "wedding_clients" FOREIGN KEY ("client_id") REFERENCES "public"."wedding_clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wedding_clients"
    ADD CONSTRAINT "wedding_clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Acesso Total" ON "public"."clients_backup_error" USING (true) WITH CHECK (true);



CREATE POLICY "Acesso Total" ON "public"."clients_bugada" USING (true) WITH CHECK (true);



CREATE POLICY "Acesso Total" ON "public"."wedding_clients" USING (true) WITH CHECK (true);



CREATE POLICY "Acesso público ao contrato via UUID" ON "public"."contracts" FOR SELECT USING (true);



CREATE POLICY "Acesso público ao projeto via UUID" ON "public"."projects" FOR SELECT USING (true);



CREATE POLICY "Acesso público aos eventos via UUID" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Acesso público contratos" ON "public"."contracts" FOR SELECT USING (true);



CREATE POLICY "Acesso público eventos" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Acesso público projetos" ON "public"."projects" FOR SELECT USING (true);



CREATE POLICY "Admin Full Access Transactions" ON "public"."transactions" TO "authenticated" USING (true);



CREATE POLICY "Admin Manage Project Services" ON "public"."project_services" TO "authenticated" USING (true);



CREATE POLICY "Admin Select Services" ON "public"."services" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Admin pode gerenciar perfis" ON "public"."profiles" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Admins can insert system config" ON "public"."system_config" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all payouts" ON "public"."payouts" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage all profiles" ON "public"."profiles" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage all projects" ON "public"."projects" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage all transactions" ON "public"."transactions" USING ("public"."is_admin"());



CREATE POLICY "Admins can update system config" ON "public"."system_config" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Admins can view all data" ON "public"."projects" FOR SELECT USING (((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() IN ( SELECT "profiles_1"."id"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."role" = 'admin'::"text"))));



CREATE POLICY "Admins podem gerenciar leads" ON "public"."leads" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins veem logs" ON "public"."notification_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Allow Admin Manage" ON "public"."project_services" TO "authenticated" USING (true);



CREATE POLICY "Allow Admin Select" ON "public"."services" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow all for now" ON "public"."bride_access" USING (true);



CREATE POLICY "Allow anonymous read for portal" ON "public"."wedding_clients" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Briefings Policy Full" ON "public"."briefings" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Criação de perfil" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Dono gerencia events" ON "public"."events" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Dono gerencia imagens" ON "public"."moodboard_images" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Dono gerencia integrações" ON "public"."user_integrations" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Dono gerencia services" ON "public"."services" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Dono vê notificações" ON "public"."assistant_notifications" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Dono vê tudo" ON "public"."transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Dono vê tudo" ON "public"."wallets" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Escrita admin" ON "public"."system_config" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'super_admin'::"text")))));



CREATE POLICY "Images Policy Full" ON "public"."moodboard_images" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Integrations Policy Full" ON "public"."user_integrations" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Invoices Policy Full" ON "public"."invoices" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Leitura de perfis autenticados" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Leitura pública" ON "public"."system_config" FOR SELECT USING (true);



CREATE POLICY "Leitura pública contratos" ON "public"."contracts" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Leitura pública de serviços" ON "public"."services" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Leitura pública project_services" ON "public"."project_services" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Leitura_Publica_Portal_Contratos" ON "public"."contracts" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Leitura_Publica_Portal_Eventos" ON "public"."events" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Leitura_Publica_Portal_Profiles" ON "public"."profiles" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Leitura_Publica_Portal_Projetos" ON "public"."projects" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Liberar Geral" ON "public"."clients_old_broken" USING (true) WITH CHECK (true);



CREATE POLICY "Noivas podem ver suas próprias receitas" ON "public"."transactions" FOR SELECT TO "anon" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects")));



CREATE POLICY "Permitir tudo para usuários autenticados" ON "public"."assistants" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir update de onboarding" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Portal Read Project Services" ON "public"."project_services" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Portal_Read_Project_Services" ON "public"."project_services" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Portal_Read_Services" ON "public"."services" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Portal_Read_Services_Base" ON "public"."services" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Portal_Read_Transactions" ON "public"."transactions" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Projects Policy Full" ON "public"."projects" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Pros can manage their bride links" ON "public"."bride_access" USING (("auth"."uid"() = "professional_id"));



CREATE POLICY "Public Access" ON "public"."projects" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Public Availability Check" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Public Booking Creation" ON "public"."events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public Profiles Access" ON "public"."profiles" FOR SELECT USING (("slug" IS NOT NULL));



CREATE POLICY "Public Read Contracts" ON "public"."contracts" FOR SELECT USING (true);



CREATE POLICY "Public Read Events" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Public Services Access" ON "public"."services" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public read config" ON "public"."system_config" FOR SELECT USING (true);



CREATE POLICY "Site pode criar leads" ON "public"."leads" FOR INSERT WITH CHECK (true);



CREATE POLICY "Tasks Policy Full" ON "public"."tasks" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create events" ON "public"."events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own contracts" ON "public"."contracts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own projects" ON "public"."projects" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own contracts" ON "public"."contracts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage assistants for their events" ON "public"."event_assistants" USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_assistants"."event_id") AND ("events"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage invites" ON "public"."team_invites" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can manage their assistants" ON "public"."assistants" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own marketing" ON "public"."marketing_campaigns" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own templates" ON "public"."message_templates" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only access their own appointments" ON "public"."appointments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only access their own profile" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can only see their own clients" ON "public"."wedding_clients" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only see their own transactions" ON "public"."transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own events" ON "public"."events" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile onboarding" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own projects" ON "public"."projects" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own contracts" ON "public"."contracts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view assistants for their events" ON "public"."event_assistants" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_assistants"."event_id") AND ("events"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own events" ON "public"."events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own projects" ON "public"."projects" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view team members" ON "public"."team_members" FOR SELECT USING ((("auth"."uid"() = "owner_id") OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Users can view templates from their organization" ON "public"."message_templates" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("organization_id" IS NOT NULL)));



CREATE POLICY "Users can view their own contracts" ON "public"."contracts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view own payouts" ON "public"."payouts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view own transactions" ON "public"."transactions" FOR SELECT USING (("wallet_id" IN ( SELECT "wallets"."id"
   FROM "public"."wallets"
  WHERE ("wallets"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users view own wallet" ON "public"."wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuário edita próprio perfil" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."analytics_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistant_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assistants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."backup_integrity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."briefings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients_backup_error" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients_bugada" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients_old_broken" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_assistants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_overview" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moodboard_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wedding_clients" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid", "p_pin" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid", "p_pin" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bride_dashboard_data"("p_client_id" "uuid", "p_pin" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_bride_pin"("client_id" "uuid", "pin_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_bride_pin"("client_id" "uuid", "pin_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_bride_pin"("client_id" "uuid", "pin_code" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."analytics_logs" TO "anon";
GRANT ALL ON TABLE "public"."analytics_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_logs" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."assistant_notifications" TO "anon";
GRANT ALL ON TABLE "public"."assistant_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."assistant_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."assistants" TO "anon";
GRANT ALL ON TABLE "public"."assistants" TO "authenticated";
GRANT ALL ON TABLE "public"."assistants" TO "service_role";



GRANT ALL ON TABLE "public"."backup_integrity_logs" TO "anon";
GRANT ALL ON TABLE "public"."backup_integrity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_integrity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."bride_access" TO "anon";
GRANT ALL ON TABLE "public"."bride_access" TO "authenticated";
GRANT ALL ON TABLE "public"."bride_access" TO "service_role";



GRANT ALL ON TABLE "public"."briefings" TO "anon";
GRANT ALL ON TABLE "public"."briefings" TO "authenticated";
GRANT ALL ON TABLE "public"."briefings" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("onboarding_completed") ON TABLE "public"."profiles" TO "authenticated";



GRANT SELECT("parent_user_id") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("google_calendar_connected") ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."clients_backup_error" TO "anon";
GRANT ALL ON TABLE "public"."clients_backup_error" TO "authenticated";
GRANT ALL ON TABLE "public"."clients_backup_error" TO "service_role";



GRANT ALL ON TABLE "public"."clients_bugada" TO "anon";
GRANT ALL ON TABLE "public"."clients_bugada" TO "authenticated";
GRANT ALL ON TABLE "public"."clients_bugada" TO "service_role";



GRANT ALL ON TABLE "public"."clients_old_broken" TO "anon";
GRANT ALL ON TABLE "public"."clients_old_broken" TO "authenticated";
GRANT ALL ON TABLE "public"."clients_old_broken" TO "service_role";



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



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



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



GRANT ALL ON TABLE "public"."project_services" TO "anon";
GRANT ALL ON TABLE "public"."project_services" TO "authenticated";
GRANT ALL ON TABLE "public"."project_services" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



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



GRANT ALL ON TABLE "public"."user_integrations" TO "anon";
GRANT ALL ON TABLE "public"."user_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



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































