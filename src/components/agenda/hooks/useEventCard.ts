import { useOrganization } from '@/hooks/useOrganization'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import {
  downloadICSFile,
  getGoogleCalendarUrl,
  openInMaps,
} from '@/lib/calendar-utils'
import { generateWhatsAppLink } from '@/utils/whatsappGenerator'
import { differenceInDays, format } from 'date-fns'
import { MessageCircle, Clock, Check, Heart } from 'lucide-react'
import { Event } from '@/hooks/useEvents'
import { logger } from '@/services/logger'

export function useEventCard(event: Event) {
  const { organizationId } = useOrganization()
  const { user } = useAuth()
  const { toast } = useToast()

  const formatTime = (time: string | null | undefined) => {
    if (!time) return null
    return time.substring(0, 5)
  }

  const handleOpenMaps = () => {
    const displayAddress = event.address || event.location
    if (displayAddress) {
      openInMaps(displayAddress, event.latitude, event.longitude)
    }
  }

  const handleExportICS = () => {
    downloadICSFile({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      arrival_time: event.arrival_time,
      making_of_time: event.making_of_time,
      ceremony_time: event.ceremony_time,
      advisory_time: event.advisory_time,
      address: event.address,
      location: event.location,
    })
  }

  const handleAddToGoogle = () => {
    const url = getGoogleCalendarUrl({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      arrival_time: event.arrival_time,
      making_of_time: event.making_of_time,
      ceremony_time: event.ceremony_time,
      advisory_time: event.advisory_time,
      address: event.address,
      location: event.location,
    })
    window.open(url, '_blank')
  }

  const getWhatsAppAction = () => {
    const daysUntil = differenceInDays(new Date(event.event_date), new Date())

    let recommendedAction = 'custom'
    let buttonColor = 'bg-zinc-700 hover:bg-zinc-600'
    let buttonLabel = 'Mensagem'
    let Icon = MessageCircle

    if (daysUntil === 1) {
      recommendedAction = 'reminder_24h'
      buttonColor = 'bg-amber-600 hover:bg-amber-700'
      buttonLabel = 'Lembrar (24h)'
      Icon = Clock
    } else if (daysUntil > 1 && daysUntil <= 7) {
      recommendedAction = 'confirmation'
      buttonColor = 'bg-blue-600 hover:bg-blue-700'
      buttonLabel = 'Confirmar'
      Icon = Check
    } else if (daysUntil < 0) {
      recommendedAction = 'thanks'
      buttonColor = 'bg-purple-600 hover:bg-purple-700'
      buttonLabel = 'Feedback'
      Icon = Heart
    }

    return { recommendedAction, buttonColor, buttonLabel, Icon }
  }

  const handleSendWhatsApp = async (recommendedAction: string) => {
    try {
      // 1. Fetch Template
      if (!organizationId) return

      const { data: template } = await supabase
        .from('message_templates')
        .select('content')
        .eq('organization_id', organizationId)
        .eq('type', recommendedAction)
        .maybeSingle()

      // Fallback
      let rawText = template?.content
      if (!rawText) {
        switch (recommendedAction) {
          case 'confirmation':
            rawText =
              'Olá {client_name}, gostaria de confirmar seu agendamento para {date}.'
            break
          case 'reminder_24h':
            rawText =
              'Olá {client_name}, lembrete do seu horário amanhã às {time}.'
            break
          case 'thanks':
            rawText = 'Obrigado pela preferência, {client_name}!'
            break
          default:
            rawText = 'Olá {client_name}!'
        }
      }

      // 2. Professional Name
      let professionalName = 'KONTROL'
      if (user) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle()
        if (profData?.full_name) professionalName = profData.full_name
      }

      // 3. Generate Link
      const link = generateWhatsAppLink(rawText, {
        client_name: event.client?.name || 'Cliente',
        professional_name: professionalName,
        date: format(new Date(event.event_date), 'dd/MM'),
        time: event.start_time || event.arrival_time || 'Horário a definir',
        location: event.location || 'Local a definir',
        phone: event.client?.phone || '',
      })

      window.open(link, '_blank')
    } catch (e) {
      logger.error(e, {
        message: 'Erro ao gerar link WhatsApp.',
        showToast: false,
      })
      toast({ title: 'Erro ao gerar link', variant: 'destructive' })
    }
  }

  return {
    formatTime,
    handleOpenMaps,
    handleExportICS,
    handleAddToGoogle,
    getWhatsAppAction,
    handleSendWhatsApp,
  }
}
