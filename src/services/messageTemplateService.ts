export type TemplateType = 'confirmation' | 'reminder_24h' | 'thanks'

export interface MessageTemplate {
  id: string
  organization_id: string
  type: TemplateType
  content: string
}

const DEFAULT_TEMPLATES: Record<TemplateType, string> = {
  confirmation:
    'Olá {name}! Confirmamos seu agendamento para {date}. Até logo!',
  reminder_24h:
    'Olá {name}! Lembrete: seu agendamento é amanhã às {time}. Até lá!',
  thanks: 'Obrigado pela visita, {name}! Esperamos vê-la em breve.',
}

export const MessageTemplateService = {
  async getTemplates(organizationId: string): Promise<MessageTemplate[]> {
    return Object.entries(DEFAULT_TEMPLATES).map(([type, content], idx) => ({
      id: `default-${idx}`,
      organization_id: organizationId,
      type: type as TemplateType,
      content,
    }))
  },

  async updateTemplate(
    organizationId: string,
    type: TemplateType,
    content: string,
  ): Promise<MessageTemplate> {
    return {
      id: `temp-${Date.now()}`,
      organization_id: organizationId,
      type,
      content,
    }
  },

  hydrateTemplate(template: string, variables: Record<string, string>) {
    let content = template
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{${key}}`, 'g'), value || '')
    }
    return content
  },

  async generateMessage(
    organizationId: string,
    type: TemplateType,
    variables: Record<string, string>,
  ) {
    const templateContent = DEFAULT_TEMPLATES[type] || ''
    return this.hydrateTemplate(templateContent, variables)
  },
}
