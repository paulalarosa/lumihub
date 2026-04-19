import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, AlignLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { WhatsAppButtons } from '@/components/whatsapp/WhatsAppButtons'
import { format } from 'date-fns/format'

import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

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
    eventType: string
    clientName?: string
    clientPhone?: string
    status: string
    isSynced: boolean
  }
}

interface EventDetailsModalProps {
  event: CalendarEvent | null
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
      onClose()
    } else if (event.resource.googleEventId) {
      window.open(
        `https://calendar.google.com/calendar/r/eventedit/${event.resource.googleEventId}`,
        '_blank',
      )
    } else {
      toast.info('Este evento não está vinculado a um projeto ou Google Calendar.')
    }
  }

  const isGoogleEvent = event.resource.eventType === 'personal' || event.resource.eventType === 'google'
  const isProject = event.resource.eventType === 'project'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white font-serif tracking-wide border-l-4 border-[#FFD700] pl-4">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
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

          <div className="flex items-center gap-3 pt-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                isGoogleEvent
                  ? 'bg-blue-900/30 text-blue-400 border border-blue-800'
                  : event.resource.eventType === 'wedding'
                    ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30'
                    : event.resource.eventType === 'social'
                      ? 'bg-[#FF69B4]/10 text-[#FF69B4] border border-[#FF69B4]/30'
                      : isProject
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'bg-gray-800 text-gray-300 border border-gray-700'
              }`}
            >
              {isGoogleEvent
                ? 'Google'
                : event.resource.eventType === 'wedding'
                  ? 'Noiva'
                  : event.resource.eventType === 'social'
                    ? 'Social'
                    : isProject
                      ? 'Projeto'
                      : 'Evento'}
            </span>

            <span className="text-xs text-neutral-500 uppercase flex items-center gap-1">
              {event.resource.status}
              {event.resource.isSynced && <RefreshCw className="w-3 h-3 text-green-500" />}
            </span>
          </div>

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
                serviceType={event.resource.eventType}
              />
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-neutral-800">
            {event.resource.projectId ? (
              <Button
                onClick={handleViewDetails}
                className="flex-1 bg-white text-black hover:bg-neutral-200"
              >
                Ver Projeto
              </Button>
            ) : event.resource.googleEventId ? (
              <Button
                onClick={handleViewDetails}
                className="flex-1 bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir no Google
              </Button>
            ) : null}
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
