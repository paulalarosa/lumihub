-- ==========================================
-- SCRIPT DE ATUALIZAÇÃO SEGURA (IDEMPOTENTE)
-- Pode ser rodado várias vezes sem erro "already exists"
-- ==========================================

-- 1. Políticas RLS para Leads e Instagram Posts
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

-- Remove as políticas caso já existam para recriá-las limpas
DROP POLICY IF EXISTS "Users can only see own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;

DROP POLICY IF EXISTS "Users can only see own instagram_posts" ON public.instagram_posts;
DROP POLICY IF EXISTS "Users can insert own instagram_posts" ON public.instagram_posts;
DROP POLICY IF EXISTS "Users can update own instagram_posts" ON public.instagram_posts;
DROP POLICY IF EXISTS "Users can delete own instagram_posts" ON public.instagram_posts;

-- Criação das políticas de Leads
CREATE POLICY "Users can only see own leads" ON public.leads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own leads" ON public.leads FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own leads" ON public.leads FOR DELETE USING (user_id = auth.uid());

-- Criação das políticas de Instagram Posts
CREATE POLICY "Users can only see own instagram_posts" ON public.instagram_posts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own instagram_posts" ON public.instagram_posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own instagram_posts" ON public.instagram_posts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own instagram_posts" ON public.instagram_posts FOR DELETE USING (user_id = auth.uid());

-- 2. Limpeza e criação da Função de Login da Assistente
-- Remove assinaturas antigas e falhas (com e-mail)
DROP FUNCTION IF EXISTS public.verify_assistant_login(uuid, text, text);
DROP FUNCTION IF EXISTS public.verify_assistant_login(text, text);

-- Cria a assinatura final correta com profissional_id e pin
CREATE OR REPLACE FUNCTION public.verify_assistant_login(p_professional_id uuid, p_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
  v_assistant RECORD;
BEGIN
  p_pin := TRIM(p_pin);

  -- Procura a assistente pelo PIN ou ACCESS_PIN cadastrado
  SELECT id, full_name INTO v_assistant
  FROM public.assistants
  WHERE pin = p_pin OR access_pin = p_pin
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'id', v_assistant.id,
      'full_name', v_assistant.full_name
    );
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- 3. Força o Banco a recarregar o Schema no Cache do PostgREST
NOTIFY pgrst, 'reload schema';
