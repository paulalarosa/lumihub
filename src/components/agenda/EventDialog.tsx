import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Palette, 
  Bell,
  Plus,
  Car,
  Camera,
  Church,
  HeartHandshake
} from 'lucide-react';
import QuickCreateClientDialog from './QuickCreateClientDialog';
import QuickCreateProjectDialog from './QuickCreateProjectDialog';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  arrival_time: string | null;
  making_of_time: string | null;
  ceremony_time: string | null;
  advisory_time: string | null;
  location: string | null;
  address: string | null;
  notes: string | null;
  color: string;
  client_id: string | null;
  project_id: string | null;
  reminder_days: number[];
  assistants?: { id: string; name: string }[];
}

interface Assistant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string;
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  assistants: Assistant[];
  selectedDate?: Date;
  onSuccess: () => void;
}

const COLORS = [
  '#5A7D7C', // Primary
  '#E57373', // Red
  '#81C784', // Green
  '#64B5F6', // Blue
  '#FFB74D', // Orange
  '#BA68C8', // Purple
  '#4DD0E1', // Cyan
  '#F06292', // Pink
];

const REMINDER_OPTIONS = [
  { value: 1, label: '1 dia antes' },
  { value: 3, label: '3 dias antes' },
  { value: 7, label: '1 semana antes' },
  { value: 14, label: '2 semanas antes' },
  { value: 30, label: '1 mês antes' },
];

export default function EventDialog({
  open,
  onOpenChange,
  event,
  assistants,
  selectedDate,
  onSuccess
}: EventDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Quick create dialogs
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [showQuickProject, setShowQuickProject] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [makingOfTime, setMakingOfTime] = useState('');
  const [ceremonyTime, setCeremonyTime] = useState('');
  const [advisoryTime, setAdvisoryTime] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [clientId, setClientId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([]);
  const [reminderDays, setReminderDays] = useState<number[]>([1, 7]);

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setEventDate(event.event_date);
      // Support legacy start_time or new specific times
      setArrivalTime(event.arrival_time || '');
      setMakingOfTime(event.making_of_time || '');
      setCeremonyTime(event.ceremony_time || event.start_time || '');
      setAdvisoryTime(event.advisory_time || '');
      setAddress(event.address || '');
      setLocation(event.location || '');
      setNotes(event.notes || '');
      setColor(event.color || COLORS[0]);
      setClientId(event.client_id || '');
      setProjectId(event.project_id || '');
      setReminderDays(event.reminder_days || [1, 7]);
      setSelectedAssistants(event.assistants?.map(a => a.id) || []);
    } else {
      resetForm();
      if (selectedDate) {
        setEventDate(format(selectedDate, 'yyyy-MM-dd'));
      }
    }
  }, [event, selectedDate, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventDate(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
    setArrivalTime('');
    setMakingOfTime('');
    setCeremonyTime('');
    setAdvisoryTime('');
    setAddress('');
    setLocation('');
    setNotes('');
    setColor(COLORS[0]);
    setClientId('');
    setProjectId('');
    setSelectedAssistants([]);
    setReminderDays([1, 7]);
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');
    if (data) setClients(data);
  };

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .order('name');
    if (data) setProjects(data);
  };

  const toggleAssistant = (assistantId: string) => {
    setSelectedAssistants(prev =>
      prev.includes(assistantId)
        ? prev.filter(id => id !== assistantId)
        : [...prev, assistantId]
    );
  };

  const toggleReminder = (days: number) => {
    setReminderDays(prev =>
      prev.includes(days)
        ? prev.filter(d => d !== days)
        : [...prev, days]
    );
  };

  const handleClientCreated = (client: { id: string; name: string }) => {
    setClients(prev => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    setClientId(client.id);
  };

  const handleProjectCreated = (project: { id: string; name: string; client_id: string }) => {
    setProjects(prev => [...prev, project].sort((a, b) => a.name.localeCompare(b.name)));
    setProjectId(project.id);
    if (!clientId) {
      setClientId(project.client_id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const eventData = {
      user_id: user.id,
      title,
      description: description || null,
      event_date: eventDate,
      arrival_time: arrivalTime || null,
      making_of_time: makingOfTime || null,
      ceremony_time: ceremonyTime || null,
      advisory_time: advisoryTime || null,
      // Keep legacy fields for backwards compatibility
      start_time: ceremonyTime || null,
      end_time: null,
      address: address || null,
      location: location || null,
      notes: notes || null,
      color,
      client_id: clientId || null,
      project_id: projectId || null,
      reminder_days: reminderDays
    };

    try {
      let eventId: string;

      if (event) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;
        eventId = event.id;

        // Delete existing assistant assignments
        await supabase
          .from('event_assistants')
          .delete()
          .eq('event_id', event.id);
      } else {
        // Create new event
        const { data, error } = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;
        eventId = data.id;
      }

      // Add assistant assignments
      if (selectedAssistants.length > 0) {
        const assignments = selectedAssistants.map(assistantId => ({
          event_id: eventId,
          assistant_id: assistantId
        }));

        await supabase.from('event_assistants').insert(assignments);
      }

      toast({
        title: "Sucesso",
        description: event ? "Evento atualizado" : "Evento criado"
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o evento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = clientId
    ? projects.filter(p => p.client_id === clientId)
    : projects;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {event ? 'Editar Evento' : 'Novo Evento'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Casamento Ana Silva"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes do evento..."
                rows={2}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="eventDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data *
              </Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            {/* Times - 4 specific times */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horários
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime" className="text-sm text-muted-foreground flex items-center gap-2">
                    <Car className="h-3.5 w-3.5" />
                    Chegada ao Local
                  </Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="makingOfTime" className="text-sm text-muted-foreground flex items-center gap-2">
                    <Camera className="h-3.5 w-3.5" />
                    Making Of
                  </Label>
                  <Input
                    id="makingOfTime"
                    type="time"
                    value={makingOfTime}
                    onChange={(e) => setMakingOfTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ceremonyTime" className="text-sm text-muted-foreground flex items-center gap-2">
                    <Church className="h-3.5 w-3.5" />
                    Cerimônia
                  </Label>
                  <Input
                    id="ceremonyTime"
                    type="time"
                    value={ceremonyTime}
                    onChange={(e) => setCeremonyTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advisoryTime" className="text-sm text-muted-foreground flex items-center gap-2">
                    <HeartHandshake className="h-3.5 w-3.5" />
                    Assessoria
                  </Label>
                  <Input
                    id="advisoryTime"
                    type="time"
                    value={advisoryTime}
                    onChange={(e) => setAdvisoryTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Address with GPS integration hint */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade - CEP"
              />
              <p className="text-xs text-muted-foreground">
                O endereço será integrado com Google Maps / Apple Maps
              </p>
            </div>

            {/* Location (venue name) */}
            <div className="space-y-2">
              <Label htmlFor="location">Nome do Local</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Espaço Villa Real"
              />
            </div>

            {/* Client and Project with quick create */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Cliente</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickClient(true)}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Novo
                  </Button>
                </div>
                <Select value={clientId || "__none__"} onValueChange={(v) => setClientId(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Projeto</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickProject(true)}
                    className="h-7 text-xs gap-1"
                    disabled={clients.length === 0}
                  >
                    <Plus className="h-3 w-3" />
                    Novo
                  </Button>
                </div>
                <Select value={projectId || "__none__"} onValueChange={(v) => setProjectId(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {filteredProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Cor
              </Label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Assistants */}
            {assistants.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assistentes
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {assistants.map(assistant => (
                    <div
                      key={assistant.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`assistant-${assistant.id}`}
                        checked={selectedAssistants.includes(assistant.id)}
                        onCheckedChange={() => toggleAssistant(assistant.id)}
                      />
                      <label
                        htmlFor={`assistant-${assistant.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {assistant.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reminders */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Lembretes
              </Label>
              <div className="flex flex-wrap gap-2">
                {REMINDER_OPTIONS.map(option => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`reminder-${option.value}`}
                      checked={reminderDays.includes(option.value)}
                      onCheckedChange={() => toggleReminder(option.value)}
                    />
                    <label
                      htmlFor={`reminder-${option.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Anotações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações internas..."
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : event ? 'Salvar' : 'Criar Evento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Create Dialogs */}
      <QuickCreateClientDialog
        open={showQuickClient}
        onOpenChange={setShowQuickClient}
        onSuccess={handleClientCreated}
      />

      <QuickCreateProjectDialog
        open={showQuickProject}
        onOpenChange={setShowQuickProject}
        onSuccess={handleProjectCreated}
        preselectedClientId={clientId}
        clients={clients}
      />
    </>
  );
}
