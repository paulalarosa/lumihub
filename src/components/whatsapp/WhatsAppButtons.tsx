import { Button } from '@/components/ui/button'
import { MessageCircle, Bell, Star } from 'lucide-react'
import { whatsappUtils } from '@/utils/whatsapp'
import { toast } from 'sonner'
import { Logger } from '@/services/logger'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/services/logger'

interface WhatsAppButtonsProps {
  phone: string
  clientName: string
  eventDate: Date
  eventTime?: string
  eventLocation?: string
  serviceType?: string
}

export const WhatsAppButtons = ({
  phone,
  clientName,
  eventDate,
  eventTime,
  eventLocation,
  serviceType,
}: WhatsAppButtonsProps) => {
  const { _user } = useAuth()

  const handleAction = async (action: 'CONFIRM' | 'REMIND' | 'FEEDBACK') => {
    let link = ''
    let actionType = ''

    switch (action) {
      case 'CONFIRM':
        link = whatsappUtils.generateWhatsAppLink({
          phone,
          clientName,
          eventDate,
          eventTime,
          eventLocation,
          serviceType,
        })
        actionType = 'SEND_WHATSAPP_CONFIRMATION'
        break
      case 'REMIND':
        link = whatsappUtils.generateReminderLink({
          phone,
          clientName,
          eventDate,
          eventTime,
        })
        actionType = 'SEND_WHATSAPP_REMINDER'
        break
      case 'FEEDBACK':
        link = whatsappUtils.generateFeedbackLink({
          phone,
          clientName,
        })
        actionType = 'SEND_WHATSAPP_FEEDBACK'
        break
    }

    if (!link) {
      toast.error('Telefone inválido ou não cadastrado')
      return
    }

    // Audit Log
    try {
      await Logger.action(
        actionType,
        {
          clientName,
          eventDate: eventDate.toISOString(),
          phone,
          target: 'whatsapp',
        },
        'WEB_UI',
      )
    } catch (error) {
      logger.error(error, {
        message: 'Falha no log de auditoria.',
        showToast: false,
      })
    }

    window.open(link, '_blank')
    toast.success('WhatsApp aberto!')
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => handleAction('CONFIRM')}
        variant="outline"
        size="sm"
        className="gap-2 border-white/20 hover:bg-white/10"
      >
        <MessageCircle className="w-4 h-4" />
        Confirmar
      </Button>

      <Button
        onClick={() => handleAction('REMIND')}
        variant="outline"
        size="sm"
        className="gap-2 border-white/20 hover:bg-white/10"
      >
        <Bell className="w-4 h-4" />
        Lembrete (24h)
      </Button>

      <Button
        onClick={() => handleAction('FEEDBACK')}
        variant="outline"
        size="sm"
        className="gap-2 border-white/20 hover:bg-white/10"
      >
        <Star className="w-4 h-4" />
        Avaliação
      </Button>
    </div>
  )
}
