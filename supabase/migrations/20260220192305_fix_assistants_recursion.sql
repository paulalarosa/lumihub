-- Correção para o erro de recursão infinita (42P17) na tabela assistants.
-- A recursão ocorre porque uma política tenta ler a tabela `profiles`, 
-- que tenta ler `assistants`, gerando um loop infinito.

-- 1. Remove qualquer política existente na tabela assistants
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'assistants' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.assistants', pol.policyname);
    END LOOP;
END $$;

-- 2. Garante que o RLS está ativo
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;

-- 3. Cria uma política permitindo que o próprio assistente gerencie seus dados corporativos
CREATE POLICY "Assistants can manage their own record (Admin Fix)"
ON public.assistants
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- 4. Cria uma política plana de leitura: usuários conectados podem visualizar o diretório de assistentes.
-- Isso quebra a recursão pois não consulta outras tabelas para verificar permissão de visualização.
CREATE POLICY "Auth users can view assistants directory (Admin Fix)"
ON public.assistants
FOR SELECT
TO authenticated
USING (true);
