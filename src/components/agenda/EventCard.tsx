import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  MapPin,
  Users,
  Edit2,
  Trash2,
  User,
  Briefcase,
  Car,
  Camera,
  Church,
  HeartHandshake,
  Navigation,
  Calendar as CalendarIcon,
  Download,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadICSFile, getGoogleCalendarUrl, openInMaps } from '@/lib/calendar-utils';
import { differenceInDays } from 'date-fns';
import { generateWhatsAppLink } from '@/utils/whatsappGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Check, Heart } from 'lucide-react';

import { Event } from '@/hooks/useEvents';

interface EventCardProps {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
  showDate?: boolean;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  'noivas': 'NOIVAS',
  'pre_wedding': 'PRE_WEDDING',
  'producoes_sociais': 'PROD_SOCIAIS'
};

export default function EventCard({ event, onEdit, onDelete, showDate = false }: EventCardProps) {
  const { organizationId } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();

  const formatTime = (time: string | null | undefined) => {
    if (!time) return null;
    return time.substring(0, 5);
  };

  const isNoivas = event.event_type === 'noivas' || !event.event_type;
  const hasNoivasTimes = event.arrival_time || event.making_of_time || event.ceremony_time || event.advisory_time;
  const hasRegularTimes = event.start_time || event.end_time;
  const displayAddress = event.address || event.location;

  const handleOpenMaps = () => {
    if (displayAddress) {
      openInMaps(displayAddress, event.latitude, event.longitude);
    }
  };

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
      location: event.location
    });
  };

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
      location: event.location
    });
    window.open(url, '_blank');
  };

  const WhatsAppSmartButton = () => {
    if (!event.client?.phone) return null;

    const daysUntil = differenceInDays(new Date(event.event_date), new Date());

    let recommendedAction = 'custom';
    let buttonColor = 'bg-zinc-700 hover:bg-zinc-600';
    let buttonLabel = 'Mensagem';
    let Icon = MessageCircle;

    if (daysUntil === 1) {
      recommendedAction = 'reminder_24h';
      buttonColor = 'bg-amber-600 hover:bg-amber-700';
      buttonLabel = 'Lembrar (24h)';
      Icon = Clock;
    } else if (daysUntil > 1 && daysUntil <= 7) {
      recommendedAction = 'confirmation';
      buttonColor = 'bg-blue-600 hover:bg-blue-700';
      buttonLabel = 'Confirmar';
      Icon = Check;
    } else if (daysUntil < 0) {
      recommendedAction = 'thanks';
      buttonColor = 'bg-purple-600 hover:bg-purple-700';
      buttonLabel = 'Feedback';
      Icon = Heart;
    }

    const handleSend = async () => {
      try {
        // 1. Fetch Template
        const { data: template } = await supabase
          .from('message_templates' as any)
          .select('content')
          .eq('organization_id', organizationId)
          .eq('type', recommendedAction)
          .single();

        // Fallback
        let rawText = template?.content;
        if (!rawText) {
          switch (recommendedAction) {
            case 'confirmation': rawText = "Olá {client_name}, gostaria de confirmar seu agendamento para {date}."; break;
            case 'reminder_24h': rawText = "Olá {client_name}, lembrete do seu horário amanhã às {time}."; break;
            case 'thanks': rawText = "Obrigado pela preferência, {client_name}!"; break;
            default: rawText = "Olá {client_name}!";
          }
        }

        // 2. Professional Name
        let professionalName = "LumiHub";
        if (user) {
          const { data: profData } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
          if ((profData as any)?.full_name) professionalName = (profData as any).full_name;
        }

        // 3. Generate Link
        const link = generateWhatsAppLink(rawText, {
          client_name: event.client?.name || "Cliente",
          professional_name: professionalName,
          date: format(new Date(event.event_date), 'dd/MM'),
          time: event.start_time || event.arrival_time || "Horário a definir",
          location: event.location || "Local a definir",
          phone: event.client?.phone || ""
        });

        window.open(link, '_blank');
      } catch (e) {
        console.error(e);
        toast({ title: "Erro ao gerar link", variant: "destructive" });
      }
    };

    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSend();
        }}
        className={`px-3 py-1 h-6 text-[10px] font-medium text-white rounded-md shadow-sm transition-all flex items-center gap-1.5 uppercase tracking-wider ${buttonColor}`}
      >
        <Icon className="h-3 w-3" />
        {buttonLabel}
      </button>
    );
  };

  return (
    <Card className="group border border-white/20 bg-black rounded-none hover:border-white transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Bar instead of Color dot */}
          <div
            className="w-1 h-full min-h-[80px] flex-shrink-0"
            style={{ backgroundColor: event.color === '#FFFFFF' ? '#333' : event.color || '#333' }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-serif text-white uppercase tracking-wider text-sm">{event.title}</h3>
                  {event.event_type && (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/50 border border-white/20 px-1">
                      {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                    </span>
                  )}
                  {event.payment_status === 'paid' ? (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-black bg-white px-1">
                      PAGO
                    </span>
                  ) : event.payment_status === 'pending' || !event.payment_status ? (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/50 border border-dashed border-white/30 px-1">
                      PENDENTE
                    </span>
                  ) : null}
                </div>
                {event.description && (
                  <p className="text-xs font-mono text-white/40 line-clamp-2 mb-2 uppercase">
                    {event.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <WhatsAppSmartButton />

                {/* Calendar export dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none text-white/50 hover:text-white hover:bg-white/10">
                      <CalendarIcon className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-black border border-white/20 rounded-none">
                    <DropdownMenuItem onClick={handleAddToGoogle} className="text-white hover:bg-white hover:text-black font-mono text-xs uppercase focus:bg-white focus:text-black">
                      <CalendarIcon className="h-3 w-3 mr-2" />
                      ADD TO GOOGLE
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportICS} className="text-white hover:bg-white hover:text-black font-mono text-xs uppercase focus:bg-white focus:text-black">
                      <Download className="h-3 w-3 mr-2" />
                      DOWNLOAD .ICS
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" onClick={onEdit} className="h-6 w-6 rounded-none text-white/50 hover:text-white hover:bg-white/10">
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete} className="h-6 w-6 rounded-none text-white/50 hover:text-white hover:bg-white/10">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Date and basic info */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/60 font-mono uppercase">
              {showDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(event.event_date), "dd/MM", { locale: ptBR })}
                </span>
              )}

              {event.client && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {event.client.name}
                </span>
              )}

              {event.project && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {event.project.name}
                </span>
              )}
            </div>

            {/* Noivas - Specific times */}
            {isNoivas && hasNoivasTimes && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3 text-[10px] font-mono text-white/50 uppercase border-t border-white/10 pt-2 border-dashed">
                {event.arrival_time && (
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    <span>CHEGADA: {formatTime(event.arrival_time)}</span>
                  </div>
                )}
                {event.making_of_time && (
                  <div className="flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    <span>MAKING_OF: {formatTime(event.making_of_time)}</span>
                  </div>
                )}
                {event.ceremony_time && (
                  <div className="flex items-center gap-1">
                    <Church className="h-3 w-3" />
                    <span>CERIMÔNIA: {formatTime(event.ceremony_time)}</span>
                  </div>
                )}
                {event.advisory_time && (
                  <div className="flex items-center gap-1">
                    <HeartHandshake className="h-3 w-3" />
                    <span>ASSESSORIA: {formatTime(event.advisory_time)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Pre Wedding / Produções Sociais - Start and End times */}
            {!isNoivas && hasRegularTimes && (
              <div className="flex items-center gap-3 mt-3 text-xs text-white/50 font-mono border-t border-white/10 pt-2 border-dashed">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(event.start_time)}
                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                </span>
              </div>
            )}

            {/* Address with GPS link */}
            {displayAddress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenMaps();
                }}
                className="flex items-center gap-1.5 mt-2 text-xs text-white hover:bg-white hover:text-black transition-colors px-1 -ml-1 w-fit font-mono uppercase"
              >
                <Navigation className="h-3 w-3 flex-shrink-0" />
                <span className="truncate max-w-[200px]">{displayAddress}</span>
                <ExternalLink className="h-2 w-2 ml-1 opacity-50" />
              </button>
            )}

            {event.assistants && event.assistants.length > 0 && (
              <div className="flex items-center gap-2 mt-3 border-t border-white/10 pt-2 border-dashed">
                <Users className="h-3 w-3 text-white/40" />
                <div className="flex flex-wrap gap-1">
                  {event.assistants.map(assistant => (
                    <span key={assistant.id} className="text-[9px] font-mono uppercase tracking-widest text-white/60 bg-white/5 px-1">
                      {assistant.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
