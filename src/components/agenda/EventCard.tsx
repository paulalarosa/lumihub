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
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
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

export default function EventCard({ event, onEdit, onDelete, showDate = false }: EventCardProps) {
  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time.substring(0, 5);
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
                <h3 className="font-semibold text-foreground">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              {showDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(event.event_date), "dd/MM", { locale: ptBR })}
                </span>
              )}
              
              {(event.start_time || event.end_time) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(event.start_time)}
                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                </span>
              )}

              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
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
