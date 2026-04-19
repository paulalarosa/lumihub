export type TemplateType = 'confirmation' | 'reminder_24h' | 'thanks'

export interface MessageTemplate {
  id: string
  organization_id: string
  type: TemplateType
  content: string
}

const DEFAULT_TEMPLATES: Record<TemplateType, string> = {
  confirmation: 'Olá {name}! Confirmamos seu agendamento para {date}. Até logo!',
  reminder_24h: 'Olá {name}! Lembrete: seu agendamento é amanhã às {time}. Até lá!',
  thanks: 'Obrigado pela visita, {name}! Esperamos vê-la em breve.',
}

export const MessageTemplateService = {
  getDefaults(): Record<TemplateType, string> {
    return { ...DEFAULT_TEMPLATES }
  },

  render(template: string, vars: Record<string, string>): string {
    return Object.entries(vars).reduce(
      (str, [key, val]) => str.replaceAll(`{${key}}`, val),
      template,
    )
  },

  async getTemplates(organizationId: string): Promise<MessageTemplate[]> {
    return Object.entries(DEFAULT_TEMPLATES).map(([type, content], idx) => ({
      id: `default-${idx}`,
      organization_id: organizationId,
      type: type as TemplateType,
      content,
    }))
  },
}
