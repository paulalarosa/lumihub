
import { supabase } from '@/integrations/supabase/client';

export type TemplateType = 'confirmation' | 'reminder_24h' | 'thanks';

export interface MessageTemplate {
    id: string;
    organization_id: string;
    type: TemplateType;
    content: string;
}

export const MessageTemplateService = {
    async getTemplates(organizationId: string) {
        const { data, error } = await supabase
            .from('message_templates' as any)
            .select('*')
            .eq('organization_id', organizationId);

        if (error) throw error;
        return data as MessageTemplate[];
    },

    async updateTemplate(organizationId: string, type: TemplateType, content: string) {
        const { data, error } = await supabase
            .from('message_templates' as any)
            .upsert({
                organization_id: organizationId,
                type,
                content
            }, { onConflict: 'organization_id, type' })
            .select()
            .single();

        if (error) throw error;
        return data as MessageTemplate;
    },

    hydrateTemplate(template: string, variables: Record<string, string>) {
        let content = template;
        for (const [key, value] of Object.entries(variables)) {
            content = content.replace(new RegExp(`{${key}}`, 'g'), value || '');
        }
        return content;
    },

    async generateMessage(organizationId: string, type: TemplateType, variables: Record<string, string>) {
        const { data } = await supabase
            .from('message_templates' as any)
            .select('content')
            .eq('organization_id', organizationId)
            .eq('type', type)
            .maybeSingle();

        const templateContent = data?.content || ''; // Fallback to empty or default? 
        // Ideally we should use defaults if not found, but for now let's return empty or the template itself if we had defaults. 
        // But defaults are in the Settings component... 
        // Let's just return hydrated content, if empty it's empty.

        return this.hydrateTemplate(templateContent, variables);
    }
};
