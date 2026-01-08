-- Create table to link services to projects with payment tracking
CREATE TABLE public.project_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  paid_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own project services"
ON public.project_services
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project services"
ON public.project_services
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project services"
ON public.project_services
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project services"
ON public.project_services
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_project_services_updated_at
BEFORE UPDATE ON public.project_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();