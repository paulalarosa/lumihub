
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';

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
import { Share, MessageSquare } from 'lucide-react';

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

    const isLeader = userRole === 'admin';
    const isNoivas = event.event_type === 'noivas';
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    const { organizationId } = useOrganization();

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
            <SheetContent className="w-full sm:max-w-xl p-0 bg-[#0a0a0a] border-l-white/10 text-white overflow-hidden flex flex-col">
                {/* Header with Cover Image/Color */}
                <div className="relative h-40 shrink-0">
                    <div
                        className="absolute inset-0 opacity-40"
                        style={{ backgroundColor: event.color }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

                    <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                        <div>
                            <Badge
                                variant="outline"
                                className="mb-2 bg-black/20 border-white/20 text-white backdrop-blur-md uppercase tracking-wider text-[10px]"
                            >
                                {event.event_type?.replace('_', ' ') || 'Evento'}
                            </Badge>
                            <h2 className="text-2xl font-serif font-light text-white leading-tight">
                                {event.title}
                            </h2>
                        </div>
                        {/* Action Buttons for Leader */}
                        {isLeader && (
                            <div className="flex gap-2">
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
                                    className="h-8 w-8 bg-white/10 hover:bg-white/20 text-white border-none rounded-full"
                                    onClick={() => onEdit(event)}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-8 w-8 bg-red-500/20 hover:bg-red-500/30 text-red-200 border-none rounded-full"
                                    onClick={() => onDelete(event.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-black/20 rounded-full"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">

                        {/* 1. Logistics / Time & Place */}
                        <section className="space-y-4">
                            <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-white" />
                                Logística & Horários
                            </h3>

                            <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="col-span-2 flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                                        <CalendarIcon className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {format(new Date(event.event_date + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                        </p>
                                        <p className="text-xs text-gray-400">Data do Evento</p>
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
                            </div>
                        </section>

                        {/* 2. Client Details (CRM) */}
                        <section className="space-y-4">
                            <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                                Dados do Cliente
                            </h3>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                                {event.client ? (
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border border-white/10">
                                            <AvatarFallback className="bg-white/5 text-white/50 font-serif">
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

                                {/* Service Logic Placeholder */}
                                {event.description && (
                                    <div className="bg-black/20 p-3 rounded-lg text-sm text-gray-300">
                                        <span className="text-xs text-gray-500 uppercase block mb-1 font-semibold">Detalhes do Serviço</span>
                                        {event.description}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 3. Operational Notes (Access Control) */}
                        <section className="space-y-4">
                            <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-400" />
                                Notas Operacionais
                            </h3>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm leading-relaxed text-gray-300">
                                {/* Leader sees everything. Assistant sees simplified view or same view depending on rule. */}
                                {/* For now, assuming Notes are shared. If we have private notes, we would filter here. */}
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

                        {/* 4. Beauty Log / Gallery */}
                        <section className="space-y-4">
                            <h3 className="text-sm uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-purple-400" />
                                Beauty Log & Inspirações
                            </h3>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <EventGallery eventId={event.id} readOnly={!isLeader} />
                            </div>
                        </section>

                        {/* 5. Actions */}
                        {isLeader && (
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
