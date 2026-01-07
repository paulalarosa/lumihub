-- ============================================
-- TABELAS PRINCIPAIS DO BEAUTY PRO
-- ============================================

-- Tabela de clientes (CRM)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  instagram TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de interações com cliente
CREATE TABLE public.client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'note', -- note, call, meeting, message
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Projetos (eventos)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_type TEXT, -- casamento, formatura, debutante, ensaio, etc
  event_date DATE,
  event_location TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
  public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Checklists de tarefas
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  visibility TEXT NOT NULL DEFAULT 'private', -- private, shared, client
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Moodboard - imagens de referência
CREATE TABLE public.moodboard_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by TEXT NOT NULL DEFAULT 'professional', -- professional, client
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Questionário de briefing
CREATE TABLE public.briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]',
  answers JSONB NOT NULL DEFAULT '{}',
  is_submitted BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contratos
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, signed
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Faturas
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue, cancelled
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Serviços oferecidos pela maquiadora
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configurações da maquiadora (marca branca)
CREATE TABLE public.professional_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#5A7D7C',
  phone TEXT,
  instagram TEXT,
  website TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moodboard_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS - CLIENTES
-- ============================================
CREATE POLICY "Users can view their own clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS - INTERAÇÕES
-- ============================================
CREATE POLICY "Users can view their own interactions" ON public.client_interactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own interactions" ON public.client_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON public.client_interactions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS - PROJETOS
-- ============================================
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS - TAREFAS
-- ============================================
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS - MOODBOARD
-- ============================================
CREATE POLICY "Users can view their own moodboard" ON public.moodboard_images
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own moodboard" ON public.moodboard_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own moodboard" ON public.moodboard_images
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS - BRIEFINGS
-- ============================================
CREATE POLICY "Users can view their own briefings" ON public.briefings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own briefings" ON public.briefings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own briefings" ON public.briefings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS - CONTRATOS
-- ============================================
CREATE POLICY "Users can view their own contracts" ON public.contracts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contracts" ON public.contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contracts" ON public.contracts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contracts" ON public.contracts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS - FATURAS
-- ============================================
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS - SERVIÇOS
-- ============================================
CREATE POLICY "Users can view their own services" ON public.services
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own services" ON public.services
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own services" ON public.services
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own services" ON public.services
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS RLS - CONFIGURAÇÕES
-- ============================================
CREATE POLICY "Users can view their own settings" ON public.professional_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON public.professional_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.professional_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_briefings_updated_at BEFORE UPDATE ON public.briefings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_professional_settings_updated_at BEFORE UPDATE ON public.professional_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FUNÇÃO PARA CRIAR CONFIGURAÇÕES AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.professional_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger para criar configurações quando perfil é criado
CREATE TRIGGER on_profile_created_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();