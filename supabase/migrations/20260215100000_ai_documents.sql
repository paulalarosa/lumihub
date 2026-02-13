-- Tabela para salvar documentos criados no Canvas
CREATE TABLE IF NOT EXISTS public.ai_documents (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('markdown', 'html', 'contract', 'script')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
  ON public.ai_documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_ai_documents_user_updated ON public.ai_documents(user_id, updated_at DESC);
