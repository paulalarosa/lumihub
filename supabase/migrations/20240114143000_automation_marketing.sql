-- Create message_templates table
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.profiles(id),
    type TEXT NOT NULL CHECK (type IN ('confirmation', 'reminder_24h', 'thanks')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, type)
);

-- RLS for message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization templates"
    ON public.message_templates FOR SELECT
    USING (organization_id = auth.uid() OR organization_id IN (
        SELECT parent_user_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can insert/update their templates"
    ON public.message_templates FOR ALL
    USING (organization_id = auth.uid());

-- Add columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.clients(id);
