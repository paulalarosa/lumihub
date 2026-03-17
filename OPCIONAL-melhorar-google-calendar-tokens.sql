-- SQL gerado pelo Khaos Assistant para CRÍTICO #3 (Opcional)
-- Melhor Prática para Google Calendar Tokens (RLS)

-- 1. Habilitar RLS (caso não esteja)
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas combinadas (assumindo nomes padrão ou limpar tudo)
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios tokens" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Enable all access for users based on user_id" ON public.google_calendar_tokens;

-- 3. Criar 4 políticas separadas (Melhor Prática Supabase)

-- POLICY 1: O usuário pode VER seu próprio token
CREATE POLICY "Users can view their own calendar tokens" 
ON public.google_calendar_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

-- POLICY 2: O usuário pode INSERIR seu próprio token
CREATE POLICY "Users can insert their own calendar tokens" 
ON public.google_calendar_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- POLICY 3: O usuário pode ATUALIZAR seu próprio token
CREATE POLICY "Users can update their own calendar tokens" 
ON public.google_calendar_tokens 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- POLICY 4: O usuário pode DELETAR seu próprio token
CREATE POLICY "Users can delete their own calendar tokens" 
ON public.google_calendar_tokens 
FOR DELETE 
USING (auth.uid() = user_id);
