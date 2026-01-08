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
  Tag
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

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type?: string | null;
  start_time: string | null;
  end_time: string | null;
  arrival_time?: string | null;
  making_of_time?: string | null;
  ceremony_time?: string | null;
  advisory_time?: string | null;
  location: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  color: string;
  client?: { name: string } | null;
  project?: { name: string } | null;
  assistants?: { id: string; name: string }[];
}

interface EventCardProps {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
  showDate?: boolean;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  'noivas': 'Noivas',
  'pre_wedding': 'Pré Wedding',
  'producoes_sociais': 'Produções Sociais'
};

export default function EventCard({ event, onEdit, onDelete, showDate = false }: EventCardProps) {
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

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Color indicator */}
          <div 
            className="w-1 h-full min-h-[60px] rounded-full flex-shrink-0"
            style={{ backgroundColor: event.color || '#5A7D7C' }}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{event.title}</h3>
                  {event.event_type && (
                    <Badge variant="outline" className="text-xs">
                      {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                    </Badge>
                  )}
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Calendar export dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleAddToGoogle}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Adicionar ao Google Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportICS}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar .ICS (Apple Calendar)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            {/* Date and basic info */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              {showDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(event.event_date), "dd/MM", { locale: ptBR })}
                </span>
              )}

              {event.client && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {event.client.name}
                </span>
              )}

              {event.project && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {event.project.name}
                </span>
              )}
            </div>

            {/* Noivas - Specific times */}
            {isNoivas && hasNoivasTimes && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                {event.arrival_time && (
                  <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    <Car className="h-3 w-3" />
                    <span>Chegada: {formatTime(event.arrival_time)}</span>
                  </div>
                )}
                {event.making_of_time && (
                  <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    <Camera className="h-3 w-3" />
                    <span>Making of: {formatTime(event.making_of_time)}</span>
                  </div>
                )}
                {event.ceremony_time && (
                  <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    <Church className="h-3 w-3" />
                    <span>Cerimônia: {formatTime(event.ceremony_time)}</span>
                  </div>
                )}
                {event.advisory_time && (
                  <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    <HeartHandshake className="h-3 w-3" />
                    <span>Assessoria: {formatTime(event.advisory_time)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Pre Wedding / Produções Sociais - Start and End times */}
            {!isNoivas && hasRegularTimes && (
              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(event.start_time)}
                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                </span>
              </div>
            )}

            {/* Address with GPS link */}
            {displayAddress && (
              <button
                onClick={handleOpenMaps}
                className="flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span className="truncate">{displayAddress}</span>
              </button>
            )}

            {event.assistants && event.assistants.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {event.assistants.map(assistant => (
                    <Badge key={assistant.id} variant="secondary" className="text-xs">
                      {assistant.name}
                    </Badge>
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
