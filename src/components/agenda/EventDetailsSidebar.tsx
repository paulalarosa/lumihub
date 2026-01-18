import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Phone,
    Mail,
    Edit2,
    Trash2,
    X,
    Image as ImageIcon,
    CheckCircle2,
    AlertCircle,
    Share,
    MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventGallery } from './EventGallery';
import { CheckoutDialog } from './CheckoutDialog';
import { MessageTemplateService, TemplateType } from '@/services/messageTemplateService';
import { useOrganization } from '@/hooks/useOrganization';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NoirDatePicker } from '@/components/ui/noir-date-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Event {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_type: string | null;
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
    client?: { name: string; phone?: string; email?: string } | null;
    project?: { name: string } | null;
    assistants?: { id: string; name: string }[];
    reminder_days: number[];
    total_value?: number;
    payment_method?: string;
    payment_status?: 'pending' | 'paid';
    assistant_commission?: number;
    google_calendar_event_id?: string | null;
}

interface EventDetailsSidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: Event | null;
    onEdit: (event: Event) => void;
    onDelete: (eventId: string) => void;
    userRole: 'admin' | 'assistant' | 'viewer'; // Passed from parent or hook
}

export function EventDetailsSidebar({
    open,
    onOpenChange,
    event,
    onEdit,
    onDelete,
    userRole
}: EventDetailsSidebarProps) {
    if (!event) return null;

    const { toast } = useToast();
    const isLeader = userRole === 'admin';
    const isNoivas = event.event_type === 'noivas';
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const { organizationId } = useOrganization();

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(event.title);
    const [editDate, setEditDate] = useState<Date | undefined>(new Date(event.event_date + 'T12:00:00')); // Default to Noon to avoid TZ issues
    const [editTime, setEditTime] = useState(isNoivas ? (event.ceremony_time || '') : (event.start_time || ''));
    const [editDescription, setEditDescription] = useState(event.description || '');
    const [loading, setLoading] = useState(false);

    // Reset state when event changes
    useEffect(() => {
        if (event) {
            setEditTitle(event.title);
            setEditDate(new Date(event.event_date + 'T12:00:00'));
            setEditTime(isNoivas ? (event.ceremony_time || '') : (event.start_time || ''));
            setEditDescription(event.description || '');
            setIsEditing(false);
        }
    }, [event, isNoivas]);

    const handleSave = async () => {
        if (!editDate) return;
        setLoading(true);
        try {
            const formattedDate = format(editDate, 'yyyy-MM-dd');

            const updates: any = {
                title: editTitle,
                event_date: formattedDate,
                description: editDescription,
            };

            if (isNoivas) {
                updates.ceremony_time = editTime;
            } else {
                updates.start_time = editTime;
            }

            const { error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', event.id);

            if (error) throw error;

            // Google Sync Logic (Simplified for Quick Edit)
            if (event.google_calendar_event_id && organizationId) {
                // We would ideally call the same logic as EventDialog. 
                // For now, let's notify the user that they might need to resync if deep changes occurred,
                // or implementing the full sync here is best.
                // IMPORTANT: To properly sync, we need the token.
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.provider_token) {
                    // Placeholder for full sync logic if needed, or trigger existing logic
                }
            }

            toast({ title: "Evento atualizado com sucesso!" });
            setIsEditing(false);
            // Trigger refresh? The parent usually handles specific updates via realtime or we might need a callback to refresh.
            window.location.reload(); // Brute force refresh for now to ensure calendar updates
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao atualizar", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteWithSync = async () => {
        // Google Delete
        if (event.google_calendar_event_id) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.provider_token) {
                    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.google_calendar_event_id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${session.provider_token}`,
                        }
                    });
                }
            } catch (e) {
                console.error("Failed to delete from Google", e);
            }
        }
        onDelete(event.id);
    };

    const handleWhatsAppShare = async (type: TemplateType) => {
        if (!event.client?.phone || !organizationId) return;

        const message = await MessageTemplateService.generateMessage(organizationId, type, {
            client_name: event.client.name,
            date: format(new Date(event.event_date + 'T00:00:00'), 'dd/MM/yyyy'),
            time: ((event.event_type === 'noivas' ? event.ceremony_time : event.start_time) || '00:00').slice(0, 5),
            location: event.location || 'Local a definir',
            professional_name: 'Lumia' // TODO: Get from organization/profile
        });

        const encodedMessage = encodeURIComponent(message);
        const phone = event.client.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 bg-[#050505] border-l-white/10 text-white overflow-hidden flex flex-col">
                {/* Header with Cover Image/Color */}
                <div className="relative h-40 shrink-0">
                    <div
                        className="absolute inset-0 opacity-40"
                        style={{ backgroundColor: event.color }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />

                    <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                        <div className="flex-1 mr-4">
                            <Badge
                                variant="outline"
                                className="mb-2 bg-black/20 border-white/20 text-white backdrop-blur-md uppercase tracking-wider text-[10px] rounded-none"
                            >
                                {event.event_type?.replace('_', ' ') || 'Evento'}
                            </Badge>
                            {isEditing ? (
                                <Input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="text-2xl font-serif font-light text-white leading-tight bg-black/50 border-white/20 rounded-none h-auto py-1"
                                />
                            ) : (
                                <h2 className="text-2xl font-serif font-light text-white leading-tight">
                                    {event.title}
                                </h2>
                            )}
                        </div>
                        {/* Action Buttons for Leader */}
                        {isLeader && (
                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8 bg-green-600/20 hover:bg-green-600/40 text-green-400 border-none rounded-full"
                                                >
                                                    <Share className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white">
                                                <DropdownMenuItem onClick={() => handleWhatsAppShare('confirmation')} className="hover:bg-white/10 cursor-pointer">
                                                    <MessageSquare className="h-4 w-4 mr-2" /> Confirmar Agendamento
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleWhatsAppShare('reminder_24h')} className="hover:bg-white/10 cursor-pointer">
                                                    <Clock className="h-4 w-4 mr-2" /> Lembrete 24h
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleWhatsAppShare('thanks')} className="hover:bg-white/10 cursor-pointer">
                                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Agradecimento
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-none rounded-none"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-8 w-8 bg-red-900/40 hover:bg-red-900/60 text-red-200 border-none rounded-none"
                                            onClick={handleDeleteWithSync}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="h-8 bg-green-600 hover:bg-green-700 text-white rounded-none text-xs uppercase"
                                        >
                                            Salvar
                                        </Button>
                                        <Button
                                            onClick={() => setIsEditing(false)}
                                            variant="ghost"
                                            className="h-8 text-white/50 hover:text-white rounded-none"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-black/20 rounded-none"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 bg-[#050505]">
                    <div className="p-6 space-y-8">

                        {/* 1. Logistics / Time & Place */}
                        <section className="space-y-4">
                            <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-2 font-serif">
                                <Clock className="h-4 w-4 text-white" />
                                Logística & Horários
                            </h3>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Data do Evento</label>
                                                <NoirDatePicker date={editDate} setDate={setEditDate} />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Horário ({isNoivas ? 'Cerimônia' : 'Início'})</label>
                                                <Input
                                                    type="time"
                                                    value={editTime}
                                                    onChange={(e) => setEditTime(e.target.value)}
                                                    className="bg-black/20 border-white/10 text-white rounded-none h-12"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Descrição</label>
                                                <Textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    className="bg-black/20 border-white/10 text-white rounded-none min-h-[100px]"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 flex items-center gap-3 mb-2">
                                            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                                                <CalendarIcon className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white font-mono">
                                                    {format(new Date(event.event_date + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                                </p>
                                                <p className="text-xs text-gray-400 uppercase tracking-wider">Data do Evento</p>
                                            </div>
                                        </div>

                                        {/* Times */}
                                        {isNoivas ? (
                                            <>
                                                {event.arrival_time && <TimeBlock label="Chegada" time={event.arrival_time} />}
                                                {event.making_of_time && <TimeBlock label="Making Of" time={event.making_of_time} />}
                                                {event.ceremony_time && <TimeBlock label="Cerimônia" time={event.ceremony_time} />}
                                                {event.advisory_time && <TimeBlock label="Assessoria" time={event.advisory_time} />}
                                            </>
                                        ) : (
                                            <>
                                                {event.start_time && <TimeBlock label="Início" time={event.start_time} />}
                                                {event.end_time && <TimeBlock label="Término" time={event.end_time} />}
                                            </>
                                        )}

                                        {/* Location */}
                                        <div className="col-span-2 mt-2 pt-3 border-t border-white/10 flex items-start gap-3">
                                            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-white font-medium">{event.location || 'Local não definido'}</p>
                                                {event.address && <p className="text-xs text-gray-400 mt-0.5">{event.address}</p>}
                                            </div>
                                        </div>
                                        <div className="col-span-2 mt-4 pt-4 border-t border-white/10">
                                            <p className="text-sm text-gray-300 leading-relaxed font-mono">
                                                {event.description || "Sem descrição."}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 2. Client Details (CRM) */}
                        {!isEditing && (
                            <section className="space-y-4">
                                <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                    Dados do Cliente
                                </h3>

                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                                    {event.client ? (
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 border border-white/10 rounded-none">
                                                <AvatarFallback className="bg-white/5 text-white/50 font-serif rounded-none">
                                                    {event.client.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-white">{event.client.name}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                    {event.client.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" /> {event.client.phone}
                                                        </span>
                                                    )}
                                                    {event.client.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> {event.client.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">Nenhum cliente vinculado.</p>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* 3. Operational Notes (Access Control) */}
                        {!isEditing && (
                            <section className="space-y-4">
                                <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                                    Notas Operacionais
                                </h3>

                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm leading-relaxed text-gray-300">
                                    {event.notes ? event.notes : (
                                        <span className="text-gray-500 italic">Nenhuma nota operacional.</span>
                                    )}
                                </div>
                                {!isLeader && (
                                    <p className="text-[10px] text-gray-600 text-center">
                                        * Visualização de Assistente (Somente Leitura)
                                    </p>
                                )}
                            </section>
                        )}

                        {/* 4. Beauty Log / Gallery */}
                        {!isEditing && (
                            <section className="space-y-4">
                                <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-purple-400" />
                                    Beauty Log & Inspirações
                                </h3>

                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <EventGallery eventId={event.id} readOnly={!isLeader} />
                                </div>
                            </section>
                        )}

                        {/* 5. Actions */}
                        {isLeader && !isEditing && (
                            <section className="pt-4 border-t border-white/10">
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-12 rounded-xl flex items-center justify-center gap-2"
                                    onClick={() => setCheckoutOpen(true)}
                                >
                                    <CheckCircle2 className="h-5 w-5" />
                                    Finalizar Atendimento
                                </Button>
                                {event.payment_status === 'paid' && (
                                    <p className="text-center text-xs text-green-400 mt-2 flex items-center justify-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Pago • {event.payment_method === 'pix' ? 'Pix' : 'Cartão'} • R$ {event.total_value}
                                    </p>
                                )}
                            </section>
                        )}

                    </div>
                </ScrollArea>
                <CheckoutDialog
                    open={checkoutOpen}
                    onOpenChange={setCheckoutOpen}
                    event={event}
                    onSuccess={() => {
                        // Refresh event data or close sidebar
                        onOpenChange(false);
                    }}
                />
            </SheetContent>
        </Sheet>
    );
}

function TimeBlock({ label, time }: { label: string, time: string }) {
    return (
        <div className="bg-black/20 p-2 rounded-lg text-center">
            <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">{label}</span>
            <span className="text-sm font-mono text-white">{time.slice(0, 5)}</span>
        </div>
    )
}
