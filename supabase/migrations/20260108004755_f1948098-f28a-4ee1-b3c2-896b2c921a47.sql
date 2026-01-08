-- Permitir acesso público ao portal via token
CREATE POLICY "Public can view projects by token" ON public.projects
  FOR SELECT USING (public_token IS NOT NULL);

CREATE POLICY "Public can view tasks by project token" ON public.tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND public_token IS NOT NULL)
  );

CREATE POLICY "Public can update client tasks" ON public.tasks
  FOR UPDATE USING (visibility = 'client');

CREATE POLICY "Public can view moodboard by project" ON public.moodboard_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = moodboard_images.project_id AND public_token IS NOT NULL)
  );

CREATE POLICY "Public can view briefings by project" ON public.briefings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = briefings.project_id AND public_token IS NOT NULL)
  );

CREATE POLICY "Public can update briefings" ON public.briefings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = briefings.project_id AND public_token IS NOT NULL)
  );

CREATE POLICY "Public can view sent contracts" ON public.contracts
  FOR SELECT USING (
    status IN ('sent', 'signed') AND
    EXISTS (SELECT 1 FROM public.projects WHERE id = contracts.project_id AND public_token IS NOT NULL)
  );

CREATE POLICY "Public can view invoices by project" ON public.invoices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = invoices.project_id AND public_token IS NOT NULL)
  );

CREATE POLICY "Public can view professional settings" ON public.professional_settings
  FOR SELECT USING (true);