import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Calendar, MapPin, AlignLeft, ExternalLink } from 'lucide-react'
import { WhatsAppButtons } from '@/components/whatsapp/WhatsAppButtons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    projectId?: string
    googleEventId?: string
    description?: string
    location?: string
    serviceType: string
    clientName?: string
    clientPhone?: string
    status: string
  }
}

interface EventDetailsModalProps {
  event: CalendarEvent
  isOpen: boolean
  onClose: () => void
}

export const EventDetailsModal = ({
  event,
  isOpen,
  onClose,
}: EventDetailsModalProps) => {
  const navigate = useNavigate()

  if (!event || !event.resource) return null

  const handleViewDetails = () => {
    if (event.resource.projectId) {
      navigate(`/projects/${event.resource.projectId}`)
    } else {
      // For Google events, maybe open Google Calendar?
      window.open(
        `https://calendar.google.com/calendar/r/eventedit/${event.resource.googleEventId}`,
        '_blank',
      )
    }
  }

  const isGoogleEvent = event.resource.serviceType === 'personal'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white font-serif tracking-wide border-l-4 border-[#FFD700] pl-4">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Data e Hora */}
          <div className="flex items-start gap-4 text-neutral-300">
            <div className="bg-neutral-800 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 font-medium uppercase tracking-wider">
                Data
              </p>
              <p className="text-white font-medium">
                {format(event.start, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-neutral-400 text-sm">
                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
              </p>
            </div>
          </div>

          {/* Location if exists */}
          {event.resource.location && (
            <div className="flex items-start gap-4 text-neutral-300">
              <div className="bg-neutral-800 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium uppercase tracking-wider">
                  Local
                </p>
                <p className="text-white">{event.resource.location}</p>
              </div>
            </div>
          )}

          {/* Description if exists */}
          {event.resource.description && (
            <div className="flex items-start gap-4 text-neutral-300">
              <div className="bg-neutral-800 p-2 rounded-lg">
                <AlignLeft className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium uppercase tracking-wider">
                  Detalhes
                </p>
                <p className="text-white text-sm whitespace-pre-wrap">
                  {event.resource.description}
                </p>
              </div>
            </div>
          )}

          {/* Tipo de Serviço Badge */}
          <div className="flex items-center gap-3 pt-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                isGoogleEvent
                  ? 'bg-blue-900/30 text-blue-400 border border-blue-800'
                  : event.resource.serviceType === 'wedding'
                    ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30'
                    : event.resource.serviceType === 'social'
                      ? 'bg-[#FF69B4]/10 text-[#FF69B4] border border-[#FF69B4]/30'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
              }`}
            >
              {isGoogleEvent
                ? 'Google Calendar'
                : event.resource.serviceType === 'wedding'
                  ? 'Noiva'
                  : event.resource.serviceType === 'social'
                    ? 'Social'
                    : 'Teste'}
            </span>

            <span className="text-xs text-neutral-500 uppercase">
              {event.resource.status}
            </span>
          </div>

          {/* WhatsApp Actions (Internal Events only) */}
          {!isGoogleEvent && event.resource.clientPhone && (
            <div className="pt-4 border-t border-neutral-800">
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-2">
                Comunicação Rápida
              </p>
              <WhatsAppButtons
                phone={event.resource.clientPhone}
                clientName={event.resource.clientName || 'Cliente'}
                eventDate={event.start}
                eventTime={format(event.start, 'HH:mm')}
                eventLocation={event.resource.location}
                serviceType={event.resource.serviceType}
              />
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-6 border-t border-neutral-800">
            <Button
              onClick={handleViewDetails}
              className="flex-1 bg-white text-black hover:bg-neutral-200"
            >
              {isGoogleEvent ? (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir no Google
                </>
              ) : (
                'Ver Projeto'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 border-neutral-700 hover:bg-neutral-800 hover:text-white"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
