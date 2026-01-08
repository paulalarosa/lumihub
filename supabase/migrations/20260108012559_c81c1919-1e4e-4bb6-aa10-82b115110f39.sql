-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  notes TEXT,
  color TEXT DEFAULT '#5A7D7C',
  reminder_days INTEGER[] DEFAULT '{1, 7}'::integer[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assistants table (users with limited access)
CREATE TABLE public.assistants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assistant_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_registered BOOLEAN DEFAULT false,
  invite_token TEXT DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_assistants junction table
CREATE TABLE public.event_assistants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES public.assistants(id) ON DELETE CASCADE,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, assistant_id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_assistants ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view their own events" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE USING (auth.uid() = user_id);

-- Assistants can view events they're tagged in
CREATE POLICY "Assistants can view tagged events" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.event_assistants ea
      JOIN public.assistants a ON ea.assistant_id = a.id
      WHERE ea.event_id = events.id AND a.assistant_user_id = auth.uid()
    )
  );

-- Assistants policies
CREATE POLICY "Users can view their own assistants" ON public.assistants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assistants" ON public.assistants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assistants" ON public.assistants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assistants" ON public.assistants
  FOR DELETE USING (auth.uid() = user_id);

-- Assistants can view their own record
CREATE POLICY "Assistants can view their own record" ON public.assistants
  FOR SELECT USING (assistant_user_id = auth.uid());

-- Event assistants policies
CREATE POLICY "Users can manage event assistants" ON public.event_assistants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e WHERE e.id = event_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Assistants can view their event assignments" ON public.event_assistants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assistants a WHERE a.id = assistant_id AND a.assistant_user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assistants_updated_at
  BEFORE UPDATE ON public.assistants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();