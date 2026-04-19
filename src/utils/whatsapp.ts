import { formatDate } from '@/lib/date-utils'

interface WhatsAppMessageParams {
  phone: string
  clientName: string
  eventDate: Date
  eventTime?: string
  eventLocation?: string
  serviceType?: string
}

export const whatsappUtils = {
  formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '')

    if (digits.length < 10) {
      return ''
    }

    if (!digits.startsWith('55')) {
      return '55' + digits
    }

    return digits
  },

  generateWhatsAppLink(params: WhatsAppMessageParams): string {
    const {
      phone,
      clientName,
      eventDate,
      eventTime,
      eventLocation,
      serviceType,
    } = params

    const formattedPhone = this.formatPhone(phone)
    if (!formattedPhone) return ''

    const formattedDate = formatDate(eventDate, "dd 'de' MMMM 'de' yyyy")
    const time = eventTime || 'horário a confirmar'
    const location = eventLocation || 'local a confirmar'
    const service = serviceType === 'wedding' ? 'casamento' : 'maquiagem social'

    const message = `Olá ${clientName}! 👋

Tudo bem? Sou do *Khaos Kontrol* e estou entrando em contato para confirmar os detalhes da sua ${service}:

📅 *Data:* ${formattedDate}
🕐 *Horário:* ${time}
📍 *Local:* ${location}

Poderia me confirmar se está tudo certo?

Se tiver alguma dúvida ou precisar de algum ajuste, estou à disposição!`

    const encodedMessage = encodeURIComponent(message)

    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
  },

  generateReminderLink(params: WhatsAppMessageParams): string {
    const { phone, clientName, eventDate, eventTime } = params

    const formattedPhone = this.formatPhone(phone)
    if (!formattedPhone) return ''

    const formattedDate = formatDate(eventDate, "dd 'de' MMMM")
    const time = eventTime || 'horário combinado'

    const message = `Olá ${clientName}! 🎨

Lembrete: amanhã (${formattedDate}) é o grande dia!

Confirmo sua maquiagem às ${time}.

*Dicas importantes:*
✅ Venha com o rosto limpo e hidratado
✅ Evite maquiagem no dia anterior
✅ Tenha em mãos fotos de referência (se houver)

Nos vemos amanhã! 💄✨`

    const encodedMessage = encodeURIComponent(message)

    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
  },

  generateFeedbackLink(params: { phone: string; clientName: string }): string {
    const { phone, clientName } = params

    const formattedPhone = this.formatPhone(phone)
    if (!formattedPhone) return ''

    const message = `Olá ${clientName}! 😊

Espero que tenha ficado linda e que tudo tenha dado certo! 💖

Sua opinião é muito importante para mim. Poderia compartilhar como foi sua experiência?

Se puder avaliar meu trabalho ou deixar um depoimento, ficarei muito grata! 🙏

Um abraço!`

    const encodedMessage = encodeURIComponent(message)

    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
  },

  generateAssistantInviteLink(params: {
    phone: string
    assistantName: string
    makeupArtistName: string
    inviteLink: string
  }): string {
    const { phone, assistantName, makeupArtistName, inviteLink } = params

    const formattedPhone = this.formatPhone(phone)
    if (!formattedPhone) return ''

    const message = `Olá ${assistantName}! 🎨

Sou ${makeupArtistName} e gostaria de te convidar para ser minha assistente!

Estou usando o *Khaos Kontrol* para gerenciar minha agenda e você terá acesso para ver os eventos em que for escalada.

Clique no link abaixo para aceitar o convite:
${inviteLink}

Qualquer dúvida, estou à disposição! 💄✨`

    const encodedMessage = encodeURIComponent(message)

    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
  },
}
