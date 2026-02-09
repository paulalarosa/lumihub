-- Migration to implement Assistant Portal Schema
-- 1. Handle legacy assistants table if it exists (rename to avoid conflict with new normalized schema)
DO $$ 
BEGIN
  -- Check if 'assistants' table exists and has 'invite_token' column (characteristic of legacy schema)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assistants' AND column_name = 'invite_token') THEN
    ALTER TABLE public.assistants RENAME TO assistants_legacy;
  END IF;
END $$;

-- 2. Add metadata column to auth.users if not exists (Idempotent)
-- (Note: Cannot easily alter auth.users in migrations usually, but user requested it. 
--  Supabase platform might restrict this. We will try, or skip if permissions fail in production. 
--  For local dev/migrations, this is usually fine if using service_role.)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'raw_user_meta_data') THEN
     ALTER TABLE auth.users ADD COLUMN raw_user_meta_data jsonb DEFAULT '{}';
  END IF;
END $$;

-- 3. Create makeup_artists table
CREATE TABLE IF NOT EXISTS public.makeup_artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  business_name text NOT NULL,
  phone text,
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'pro')),
  subscription_status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.makeup_artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Makeup artists can view own profile" ON public.makeup_artists;
CREATE POLICY "Makeup artists can view own profile"
  ON public.makeup_artists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Makeup artists can update own profile" ON public.makeup_artists;
CREATE POLICY "Makeup artists can update own profile"
  ON public.makeup_artists FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Create assistants table
CREATE TABLE IF NOT EXISTS public.assistants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  is_upgraded boolean DEFAULT false, 
  upgraded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Assistants can view own profile" ON public.assistants;
CREATE POLICY "Assistants can view own profile"
  ON public.assistants FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Assistants can update own profile" ON public.assistants;
CREATE POLICY "Assistants can update own profile"
  ON public.assistants FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Create assistant_invites table
CREATE TABLE IF NOT EXISTS public.assistant_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  makeup_artist_id uuid REFERENCES public.makeup_artists(id) ON DELETE CASCADE NOT NULL,
  assistant_email text NOT NULL,
  invite_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistant_invites_token ON public.assistant_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_assistant_invites_email ON public.assistant_invites(assistant_email);

ALTER TABLE public.assistant_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Makeup artists can view own invites" ON public.assistant_invites;
CREATE POLICY "Makeup artists can view own invites"
  ON public.assistant_invites FOR SELECT
  USING (
    makeup_artist_id IN (
      SELECT id FROM public.makeup_artists WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Makeup artists can create invites" ON public.assistant_invites;
CREATE POLICY "Makeup artists can create invites"
  ON public.assistant_invites FOR INSERT
  WITH CHECK (
    makeup_artist_id IN (
      SELECT id FROM public.makeup_artists WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Assistants can view invites sent to them" ON public.assistant_invites;
CREATE POLICY "Assistants can view invites sent to them"
  ON public.assistant_invites FOR SELECT
  USING (
    assistant_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 6. Create assistant_access table (Multi-tenant relation)
CREATE TABLE IF NOT EXISTS public.assistant_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id uuid REFERENCES public.assistants(id) ON DELETE CASCADE NOT NULL,
  makeup_artist_id uuid REFERENCES public.makeup_artists(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  granted_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE(assistant_id, makeup_artist_id, status)
);

CREATE INDEX IF NOT EXISTS idx_assistant_access_assistant ON public.assistant_access(assistant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_access_makeup_artist ON public.assistant_access(makeup_artist_id);

ALTER TABLE public.assistant_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Makeup artists can view their assistants" ON public.assistant_access;
CREATE POLICY "Makeup artists can view their assistants"
  ON public.assistant_access FOR SELECT
  USING (
    makeup_artist_id IN (
      SELECT id FROM public.makeup_artists WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Assistants can view their connections" ON public.assistant_access;
CREATE POLICY "Assistants can view their connections"
  ON public.assistant_access FOR SELECT
  USING (
    assistant_id IN (
      SELECT id FROM public.assistants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Makeup artists can revoke access" ON public.assistant_access;
CREATE POLICY "Makeup artists can revoke access"
  ON public.assistant_access FOR UPDATE
  USING (
    makeup_artist_id IN (
      SELECT id FROM public.makeup_artists WHERE user_id = auth.uid()
    )
  );

-- 7. Update appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS assistant_id uuid REFERENCES public.assistants(id);

-- Update RLS for appointments to allow assistants to view
DROP POLICY IF EXISTS "Assistants can view assigned appointments" ON public.appointments;
CREATE POLICY "Assistants can view assigned appointments"
  ON public.appointments FOR SELECT
  USING (
    assistant_id IN (
      SELECT id FROM public.assistants WHERE user_id = auth.uid()
    )
    AND (
      SELECT id FROM public.makeup_artists WHERE user_id = appointments.user_id
    ) IN (
      SELECT makeup_artist_id 
      FROM public.assistant_access 
      WHERE assistant_id = (
        SELECT id FROM public.assistants WHERE user_id = auth.uid()
      )
      AND status = 'active'
    )
  );
-- Note: 'makeup_artist_id' column must exist in appointments. Usually it is 'user_id' of the pro?
-- If appointments.user_id IS the makeup artist ID (user_id), then we compare with auth.uid() normally.
-- BUT here we are comparing against 'makeup_artist_id' from assistant_access which is a UUID from 'makeup_artists' table (not auth.users).
-- Wait: appointments table typically has 'user_id' which references auth.users (the pro).
-- In assistant_access, 'makeup_artist_id' references 'makeup_artists' table (the profile).
-- So we need to join/check correctly.
-- appointments.user_id (auth id) vs makeup_artists.user_id (auth id).
-- Let's verify this logic.
-- If appointments has 'user_id' (Pro Auth ID).
-- We need to check if that Pro Auth ID corresponds to a makeup_artist_id that the assistant has access to.
-- subquery: SELECT makeup_artist_id FROM assistant_access WHERE assistant_id = ...
-- returns list of 'makeup_artists' table IDs.
-- We need to know which 'makeup_artists' ID corresponds to appointments.user_id.
-- (SELECT id FROM makeup_artists WHERE user_id = appointments.user_id) IN (...)
-- Revised Policy logic:
-- USING (
--   assistant_id IN (SELECT id FROM public.assistants WHERE user_id = auth.uid())
--   AND
--   (SELECT id FROM public.makeup_artists WHERE user_id = appointments.user_id) IN (
--     SELECT makeup_artist_id 
--     FROM public.assistant_access 
--     WHERE assistant_id = (SELECT id FROM public.assistants WHERE user_id = auth.uid()) 
--     AND status = 'active'
--   )
-- )
-- However, I will stick to what the user provided IF it makes sense, but the user provided:
-- AND makeup_artist_id IN (...)
-- This implies 'appointments' table HAS a 'makeup_artist_id' column. 
-- Looking at types.ts (Step 1682), appointments has 'user_id'. It does NOT have 'makeup_artist_id'.
-- So usage of 'makeup_artist_id' in the user's provided policy for 'appointments' is likely a mistake or implies adding that column too.
-- Given 'user_id' is the standard owner column, I should adapt the policy to use 'user_id'.
-- I will use my revised logic above in the final script.

-- 8. Functions
-- Function: accept_assistant_invite
CREATE OR REPLACE FUNCTION public.accept_assistant_invite(
  p_invite_token text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function: check_assistant_exists
CREATE OR REPLACE FUNCTION public.check_assistant_exists(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function: create_assistant_invite
CREATE OR REPLACE FUNCTION public.create_assistant_invite(
  p_makeup_artist_id uuid,
  p_assistant_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite_id uuid;
  v_invite_token text;
  v_assistant_check jsonb;
BEGIN
  -- Verificar se assistente já existe
  SELECT public.check_assistant_exists(p_assistant_email) INTO v_assistant_check;
  
  -- Se já existe E já tem acesso, retornar aviso
  IF (v_assistant_check->>'is_assistant')::boolean THEN
    IF EXISTS(
      SELECT 1 FROM public.assistant_access
      WHERE assistant_id = (v_assistant_check->>'assistant_id')::uuid
        AND makeup_artist_id = p_makeup_artist_id
        AND status = 'active'
    ) THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Assistant already has access',
        'existing_assistant', true
      );
    END IF;
  END IF;
  
  -- Criar convite
  INSERT INTO public.assistant_invites (makeup_artist_id, assistant_email)
  VALUES (p_makeup_artist_id, p_assistant_email)
  RETURNING id, invite_token INTO v_invite_id, v_invite_token;
  
  RETURN jsonb_build_object(
    'success', true,
    'invite_id', v_invite_id,
    'invite_token', v_invite_token,
    'invite_link', 'https://khaoskontrol.com.br/assistant/accept/' || v_invite_token,
    'existing_user', (v_assistant_check->>'exists')::boolean
  );
END;
$$;

-- Trigger: Auto-expire invites
CREATE OR REPLACE FUNCTION public.expire_old_invites()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.assistant_invites
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
  
  RETURN NULL;
END;
$$;

-- Note: We generally don't attach cron triggers in migration files unless pg_cron is definitely available.
-- User instruction was "Executar diariamente".
-- We will stick to creating the function. User can schedule it.

