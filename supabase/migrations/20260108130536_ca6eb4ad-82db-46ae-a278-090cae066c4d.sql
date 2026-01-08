-- =============================================
-- SECURITY FIX: RLS Policy Update (Fixed)
-- =============================================

-- 1. Add is_public column to professional_settings for controlled public access
ALTER TABLE public.professional_settings 
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- 2. Drop the overly permissive public policy and recreate with restriction
DROP POLICY IF EXISTS "Public can view professional settings" ON public.professional_settings;
DROP POLICY IF EXISTS "Public can view opted-in professional profiles" ON public.professional_settings;

CREATE POLICY "Public can view opted-in professional profiles" 
ON public.professional_settings 
FOR SELECT 
USING (is_public = true);

-- 3. Create function for assistant to check if they can access a project's tasks
CREATE OR REPLACE FUNCTION public.is_assistant_for_project(_assistant_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_assistants ea
    JOIN public.assistants a ON a.id = ea.assistant_id
    JOIN public.events e ON e.id = ea.event_id
    WHERE a.assistant_user_id = _assistant_user_id
      AND e.project_id = _project_id
  );
$$;

-- 4. Fix tasks policies for assistants
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Assistants can view their project tasks" ON public.tasks;
DROP POLICY IF EXISTS "Assistants can update visible tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;

CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Assistants can view assigned project tasks"
ON public.tasks
FOR SELECT
USING (is_assistant_for_project(auth.uid(), project_id));

CREATE POLICY "Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Assistants can update visible tasks"
ON public.tasks
FOR UPDATE
USING (
  visibility IN ('assistant', 'client')
  AND is_assistant_for_project(auth.uid(), project_id)
);

-- 5. Create function to validate project token access
CREATE OR REPLACE FUNCTION public.has_project_access(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = _project_id 
    AND public_token IS NOT NULL
  );
$$;

-- 6. Fix briefings policies
DROP POLICY IF EXISTS "Public can view briefings by project" ON public.briefings;
DROP POLICY IF EXISTS "Public can update briefings" ON public.briefings;
DROP POLICY IF EXISTS "Public can view briefings with valid project" ON public.briefings;
DROP POLICY IF EXISTS "Public can submit briefings for valid projects" ON public.briefings;
DROP POLICY IF EXISTS "Users can view their own briefings" ON public.briefings;
DROP POLICY IF EXISTS "Users can update their own briefings" ON public.briefings;

CREATE POLICY "Users can view their own briefings" 
ON public.briefings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own briefings" 
ON public.briefings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view briefings with valid project token" 
ON public.briefings 
FOR SELECT 
USING (has_project_access(project_id));

CREATE POLICY "Public can submit briefings for valid project token" 
ON public.briefings 
FOR UPDATE 
USING (has_project_access(project_id));

-- 7. Fix projects policies
DROP POLICY IF EXISTS "Public can view projects by token" ON public.projects;
DROP POLICY IF EXISTS "Limited public view of projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view projects with token" 
ON public.projects 
FOR SELECT 
USING (public_token IS NOT NULL);