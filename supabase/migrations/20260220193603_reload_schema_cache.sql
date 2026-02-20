-- Forçar o recarregamento do cache do schema no PostgREST
-- Isso vai limpar qualquer política antiga que ficou em cache e está causando o 42P17 fantasma.
NOTIFY pgrst, 'reload schema';
