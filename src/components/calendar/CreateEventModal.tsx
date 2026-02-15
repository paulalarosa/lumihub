
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate: Date | null;
    onSuccess: () => void;
}

export const CreateEventModal = ({
    isOpen,
    onClose,
    initialDate,
    onSuccess,
}: CreateEventModalProps) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
        startTime: '09:00',
        endTime: '12:00',
        location: '',
        eventType: 'wedding' as const,
    });

    const createEventMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Não autenticado');

            const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
            const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`);

            // 1. Criar evento no Supabase
            const { data: event, error } = await supabase
                .from('calendar_events')
                .insert({
                    user_id: user.id,
                    title: formData.title,
                    description: formData.description,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    location: formData.location,
                    event_type: formData.eventType,
                    status: 'confirmed',
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Sincronizar com Google Calendar (se conectado)
            try {
                await supabase.functions.invoke('sync-event-to-google', {
                    body: {
                        event_id: event.id,
                        action: 'create',
                    },
                });
            } catch (syncError) {
                console.error('Google sync failed:', syncError);
                // Não falhar a criação se o sync falhar
            }

            return event;
        },
        onSuccess: () => {
            toast.success('Evento criado e sincronizado!');
            onSuccess();
            onClose();
            resetForm();
        },
        onError: (error: any) => {
            console.error('Create error:', error);
            toast.error('Erro ao criar evento: ' + error.message);
        },
    });

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            startDate: '',
            startTime: '09:00',
            endTime: '12:00',
            location: '',
            eventType: 'wedding',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createEventMutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-neutral-900 border-neutral-800 max-w-2xl text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-white">Novo Evento</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Título */}
                    <div>
                        <Label htmlFor="title" className="text-white">Título *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Casamento da Maria"
                            required
                            className="bg-neutral-800 border-neutral-700 text-white"
                        />
                    </div>

                    {/* Tipo */}
                    <div>
                        <Label htmlFor="eventType" className="text-white">Tipo de Evento *</Label>
                        <Select
                            value={formData.eventType}
                            onValueChange={(value: any) => setFormData({ ...formData, eventType: value })}
                        >
                            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                <SelectItem value="wedding">Noiva</SelectItem>
                                <SelectItem value="social">Social</SelectItem>
                                <SelectItem value="test">Teste</SelectItem>
                                <SelectItem value="blocked">Bloqueado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Data e Horário */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="startDate" className="text-white">Data *</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>
                        <div>
                            <Label htmlFor="startTime" className="text-white">Início *</Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                required
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>
                        <div>
                            <Label htmlFor="endTime" className="text-white">Fim *</Label>
                            <Input
                                id="endTime"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                required
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>
                    </div>

                    {/* Local */}
                    <div>
                        <Label htmlFor="location" className="text-white">Local</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Ex: Salão de Festas ABC"
                            className="bg-neutral-800 border-neutral-700 text-white"
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <Label htmlFor="description" className="text-white">Descrição</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalhes do evento..."
                            rows={3}
                            className="bg-neutral-800 border-neutral-700 text-white"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="border-neutral-700 text-white hover:bg-neutral-800">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createEventMutation.isPending} className="bg-white text-black hover:bg-neutral-200">
                            {createEventMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                'Criar Evento'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
