import type { WorkflowAction } from './hooks/useWorkflows'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_label: string
  actions: WorkflowAction[]
  icon: string
}

/**
 * Pre-built workflow templates for 1-click creation.
 * Each template's actions use template interpolation placeholders
 * like {{full_name}}, {{amount}}, {{event_date}} that get filled at runtime
 * from the trigger payload.
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'welcome-new-client',
    name: 'Boas-vindas a nova cliente',
    description:
      'Quando uma nova cliente for cadastrada, envia email de boas-vindas com próximos passos.',
    trigger_type: 'client_created',
    trigger_label: 'Cliente criada',
    icon: 'UserPlus',
    actions: [
      {
        type: 'send_email',
        to_from: 'payload_client_email',
        subject: 'Que bom ter você aqui, {{full_name}}!',
        body: `<p>Olá {{full_name}},</p>
<p>Seja muito bem-vinda. Seu cadastro foi feito com sucesso e em breve entro em contato para alinharmos os detalhes do seu grande dia.</p>
<p>Qualquer coisa que precisar, é só responder esse email.</p>
<p>Com carinho,<br>Equipe Khaos Kontrol</p>`,
      },
    ],
  },
  {
    id: 'thankyou-payment',
    name: 'Obrigada pelo pagamento',
    description:
      'Dispara quando uma fatura é paga, agradecendo a cliente em 1 email profissional.',
    trigger_type: 'invoice_paid',
    trigger_label: 'Fatura paga',
    icon: 'Heart',
    actions: [
      {
        type: 'send_email',
        to_from: 'payload_client_email',
        subject: 'Recebemos seu pagamento',
        body: `<p>Oi,</p>
<p>Acabamos de registrar o pagamento de <strong>R$ {{amount}}</strong>. Muito obrigada pela confiança!</p>
<p>Qualquer coisa, é só chamar.</p>`,
      },
    ],
  },
  {
    id: 'contract-signed-followup',
    name: 'Follow-up pós-assinatura',
    description:
      'Cria tarefa 7 dias após contrato assinado + notifica você no app.',
    trigger_type: 'contract_signed',
    trigger_label: 'Contrato assinado',
    icon: 'FileSignature',
    actions: [
      {
        type: 'notify',
        channel: 'in_app',
        title: 'Novo contrato assinado',
        message: '{{title}} foi assinado. Alinhar detalhes.',
      },
      {
        type: 'create_task',
        title: 'Ligar para {{title}} (pós-assinatura)',
        due_in_days: 7,
      },
    ],
  },
  {
    id: 'lead-converted-celebrate',
    name: 'Lead convertida — criar tarefa de onboarding',
    description:
      'Quando uma lead vira cliente, cria tarefa de onboarding e notifica você.',
    trigger_type: 'lead_converted',
    trigger_label: 'Lead convertida',
    icon: 'Sparkles',
    actions: [
      {
        type: 'notify',
        channel: 'in_app',
        title: 'Lead convertida',
        message: '{{client_name}} virou cliente ({{value}}). Parabéns!',
      },
      {
        type: 'create_task',
        title: 'Onboarding {{client_name}}',
        due_in_days: 2,
      },
    ],
  },
  {
    id: 'event-confirmation',
    name: 'Confirmação de evento criado',
    description:
      'Envia email de confirmação à cliente quando novo evento é agendado.',
    trigger_type: 'event_created',
    trigger_label: 'Evento criado',
    icon: 'Calendar',
    actions: [
      {
        type: 'send_email',
        to_from: 'payload_client_email',
        subject: 'Seu evento está confirmado — {{title}}',
        body: `<p>Olá,</p>
<p>Confirmado seu evento <strong>{{title}}</strong> em <strong>{{event_date}}</strong>.</p>
<p>Qualquer ajuste, me avisa até 48h antes.</p>
<p>Até breve!</p>`,
      },
    ],
  },
  {
    id: 'internal-alert-new-client',
    name: 'Alerta interno — nova cliente',
    description:
      'Notificação in-app quando uma cliente se cadastra (sem mandar email pra ela).',
    trigger_type: 'client_created',
    trigger_label: 'Cliente criada',
    icon: 'Bell',
    actions: [
      {
        type: 'notify',
        channel: 'in_app',
        title: 'Nova cliente cadastrada',
        message:
          '{{full_name}} foi cadastrada. Revise os dados em Clientes.',
      },
    ],
  },
]
