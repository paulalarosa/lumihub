import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NoirDatePicker } from '@/components/ui/noir-date-picker';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
    CalendarIcon,
    MapPin,
    Clock,
    User,
    Check,
    ChevronsUpDown,
    Trash2,
    Save,
    X,
    Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/hooks/useOrganization';

interface Event {
    id: string;
    title: string;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    address?: string | null;
    notes: string | null;
    client_id: string | null;
    project_id: string | null;
    client?: { id: string, name: string; phone?: string; email?: string } | null;
    assistants?: { id: string; name: string }[];
    event_type?: string | null;
    total_value?: number;
    updated_at?: string;
}

interface Assistant {
    id: string;
    name: string;
}

interface Client {
    id: string;
    name: string;
}

interface EventDetailsSidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: Event | null;
    onEdit: (event: Event) => void;
    onDelete: (eventId: string) => void;
    userRole: 'admin' | 'assistant' | 'viewer';
}

export function EventDetailsSidebar({
    open,
    onOpenChange,
    event: initialEvent,
    onEdit,
    onDelete,
    userRole
}: EventDetailsSidebarProps) {
    const { toast } = useToast();
    const isLeader = userRole === 'admin';
    const { organizationId } = useOrganization();

    // State
    const [title, setTitle] = useState('');
    const [clientId, setClientId] = useState<string | null>(null);
    const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    // Assistants State
    const [selectedAssistants, setSelectedAssistants] = useState<string[]>([]);
    const [openAssistantCombobox, setOpenAssistantCombobox] = useState(false);

    // Data Lists
    const [clients, setClients] = useState<Client[]>([]);
    const [availableAssistants, setAvailableAssistants] = useState<Assistant[]>([]);
    const [fetchingDetail, setFetchingDetail] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            fetchLists();
            if (initialEvent?.id) {
                fetchEventDetails(initialEvent.id);
            }
        } else {
            // Reset form on close
            resetForm();
        }
    }, [open, initialEvent]);

    const resetForm = () => {
        setTitle('');
        setClientId(null);
        setEventDate(undefined);
        setStartTime('');
        setEndTime('');
        setLocation('');
        setNotes('');
        setSelectedAssistants([]);
    };

    const fetchLists = async () => {
        // Fetch Clients
        const { data: clientsData } = await supabase
            .from('wedding_clients')
            .select('id, name:full_name') // Alias for compatibility
            .order('full_name');

        if (clientsData) {
            setClients(clientsData.map(c => ({ id: c.id, name: c.name })));
        }

        // Fetch Assistants
        const { data: assistantsData } = await supabase
            .from('assistants')
            .select('id, full_name')
            .order('full_name');

        if (assistantsData) {
            setAvailableAssistants(assistantsData.map(a => ({ id: a.id, name: a.full_name })));
        }
    };

    const fetchEventDetails = async (id: string) => {
        setFetchingDetail(true);
        try {
            const { data: eventData, error } = await supabase
                .from('events')
                .select(`
                    *,
                    client:wedding_clients(id, name:full_name)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (eventData) {
                setTitle(eventData.title);
                setClientId(eventData.client_id);
                setEventDate(parseISO(eventData.event_date));
                setStartTime(eventData.start_time?.slice(0, 5) || '');
                setEndTime(eventData.end_time?.slice(0, 5) || '');
                setLocation(eventData.location || eventData.address || ''); // Fallback to address
                setNotes(eventData.notes || '');

                // Fetch current assistants for this event
                const { data: relData } = await supabase
                    .from('event_assistants')
                    .select('assistant_id')
                    .eq('event_id', id);

                if (relData) {
                    setSelectedAssistants(relData.map(r => r.assistant_id));
                }
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            toast({
                title: 'Erro ao carregar detalhes',
                variant: 'destructive'
            });
        } finally {
            setFetchingDetail(false);
        }
    };

    const handleSave = async () => {
        if (!initialEvent?.id) return;
        setSaving(true);

        try {
            // 1. Update Event Core Data
            const updates: Partial<Event> = {
                title,
                client_id: clientId,
                event_date: eventDate ? format(eventDate, 'yyyy-MM-dd') : null,
                start_time: startTime ? `${startTime}:00` : null,
                end_time: endTime ? `${endTime}:00` : null,
                location: location,
                address: location, // Sync address for compatibility
                notes: notes,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', initialEvent.id);

            if (error) throw error;

            // 2. Update Assistants (Delete All + Re-insert)
            // Transaction-like approach not fully supported in client lib, doing sequential
            await supabase.from('event_assistants').delete().eq('event_id', initialEvent.id);

            if (selectedAssistants.length > 0) {
                const assistantsToInsert = selectedAssistants.map(aid => ({
                    event_id: initialEvent.id,
                    assistant_id: aid
                }));
                const { error: assistError } = await supabase
                    .from('event_assistants')
                    .insert(assistantsToInsert);

                if (assistError) throw assistError;
            }

            toast({
                title: 'Evento atualizado!',
                description: 'As alterações foram salvas com sucesso.',
            });

            // Trigger Parent Update
            onEdit({
                ...initialEvent,
                ...updates,
                assistants: availableAssistants.filter(a => selectedAssistants.includes(a.id)).map(a => ({ id: a.id, name: a.name })),
                client: clientId ? clients.find(c => c.id === clientId) : null
            });

            onOpenChange(false);

        } catch (error) {
            console.error('Error saving:', error);
            toast({
                title: 'Erro ao salvar',
                description: 'Verifique sua conexão e tente novamente.',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        // Confirm?
        // Check if on delete has confirm? Assume parent handles or allow direct delete call.
        // Usually safer to show alert, but for speed we'll assume the parent `onDelete` might confirm 
        // OR we just execute. Previous code had a simpler delete.
        // We will call the prop.
        if (initialEvent?.id) {
            onDelete(initialEvent.id);
            onOpenChange(false);
        }
    };

    // Toggle Assistant
    const toggleAssistant = (id: string) => {
        setSelectedAssistants(current =>
            current.includes(id)
                ? current.filter(aid => aid !== id)
                : [...current, id]
        );
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {/* Sheet Content with improved styling */}
            <SheetContent
                className="w-[400px] sm:w-[540px] flex flex-col p-0 gap-0 bg-background border-l shadow-2xl"
                side="right"
            >
                <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between sticky top-0 bg-background z-10">
                    <SheetTitle className="text-xl font-semibold">Editar Evento</SheetTitle>
                    {/* Close button is auto-rendered by SheetContent usually, or we can add custom if needed, but standard is fine */}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    {fetchingDetail ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Main Info */}
                            <div className="space-y-4">

                                {/* Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-sm font-medium">Título do Evento</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ex: Casamento Maria & João"
                                        className="h-10"
                                    />
                                </div>

                                {/* Client */}
                                <div className="space-y-2">
                                    <Label htmlFor="client" className="text-sm font-medium">Cliente Principal</Label>
                                    <Select value={clientId || ''} onValueChange={setClientId}>
                                        <SelectTrigger id="client" className="h-10">
                                            <SelectValue placeholder="Selecione um cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map(client => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Data</Label>
                                        <NoirDatePicker
                                            date={eventDate}
                                            setDate={setEventDate}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Início</Label>
                                            <div className="relative">
                                                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    className="pl-9 h-10 text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Fim</Label>
                                            <div className="relative">
                                                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    type="time"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    className="pl-9 h-10 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-sm font-medium">Localização</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Endereço ou nome do local"
                                            className="pl-9 h-10"
                                        />
                                    </div>
                                </div>

                                {/* Assistants MultiSelect */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Equipe / Assistentes</Label>
                                    <Popover open={openAssistantCombobox} onOpenChange={setOpenAssistantCombobox}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openAssistantCombobox}
                                                className="w-full justify-between h-auto min-h-[2.5rem] py-2"
                                            >
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedAssistants.length > 0 ? (
                                                        selectedAssistants.map(id => {
                                                            const assistant = availableAssistants.find(a => a.id === id);
                                                            return assistant ? (
                                                                <Badge key={id} variant="secondary" className="mr-1 mb-1">
                                                                    {assistant.name}
                                                                </Badge>
                                                            ) : null;
                                                        })
                                                    ) : (
                                                        <span className="text-muted-foreground font-normal">Selecione assistentes...</span>
                                                    )}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[350px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Buscar assistente..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhum assistente encontrado.</CommandEmpty>
                                                    <CommandGroup>
                                                        {availableAssistants.map((assistant) => (
                                                            <CommandItem
                                                                key={assistant.id}
                                                                value={assistant.name}
                                                                onSelect={() => toggleAssistant(assistant.id)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedAssistants.includes(assistant.id) ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {assistant.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Internal Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-sm font-medium">Notas Internas</Label>
                                    <Textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Detalhes logísticos, lembretes, etc."
                                        rows={4}
                                        className="resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <SheetFooter className="px-6 py-4 border-t bg-background mt-auto flex items-center justify-between sm:justify-between sm:space-x-0">
                    <Button
                        variant="ghost"
                        onClick={handleDelete}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        disabled={saving}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
