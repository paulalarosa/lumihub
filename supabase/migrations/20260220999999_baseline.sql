-- 1. CONFIGURAÇÕES INICIAIS
SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;

-- 2. TIPOS CUSTOMIZADOS (Com verificação de existência)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE "public"."user_role" AS ENUM ('admin', 'editor', 'viewer');
    END IF;
END $$;

-- 3. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- 4. FUNÇÕES CORE CORRIGIDAS
CREATE OR REPLACE FUNCTION "public"."generate_signature_hash"(
    "p_signer_name" text, 
    "p_signer_email" text, 
    "p_signer_cpf" text, 
    "p_signature_data" text, 
    "p_contract_id" uuid, 
    "p_timestamp" timestamp with time zone, 
    "p_ip_address" text, 
    "p_device_fingerprint" text
) RETURNS text LANGUAGE "plpgsql" STABLE AS $$
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

-- 5. TABELAS PRINCIPAIS (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "public"."makeup_artists" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    "business_name" text NOT NULL,
    "plan_type" text DEFAULT 'essencial' CHECK (plan_type IN ('essencial', 'profissional', 'studio')),
    "plan_status" text DEFAULT 'active',
    "trial_ends_at" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."wedding_clients" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid REFERENCES auth.users(id),
    "full_name" text,
    "email" text,
    "phone" text,
    "is_bride" boolean DEFAULT false,
    "access_pin" text,
    "created_at" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    "client_id" uuid REFERENCES wedding_clients(id) ON DELETE SET NULL,
    "name" text NOT NULL,
    "status" text DEFAULT 'planning',
    "event_date" timestamptz,
    "total_value" numeric DEFAULT 0,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- [Restante das tabelas seguindo o mesmo padrão IF NOT EXISTS...]