
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface Assistant {
    id: string;
    name: string;
}

interface CheckoutEvent {
    id: string;
    total_value?: number;
    payment_method?: string;
    title?: string;
    event_date?: string;
}

interface CheckoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: CheckoutEvent | null;
    onSuccess: () => void;
}

export function CheckoutDialog({ open, onOpenChange, event, onSuccess }: CheckoutDialogProps) {
    const [loading, setLoading] = useState(false);
    const [totalValue, setTotalValue] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<string>('pix');
    const [selectedAssistantId, setSelectedAssistantId] = useState<string>('none');
    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            fetchAssistants();
            if (event?.total_value) setTotalValue(event.total_value.toString());
            if (event?.payment_method) setPaymentMethod(event.payment_method);
        }
    }, [open, event]);

    const fetchAssistants = async () => {
        const { data } = await supabase.from('assistants').select('id, name');
        if (data) setAssistants(data);
    };

    const handleFinish = async () => {
        try {
            setLoading(true);
            const numericValue = parseFloat(totalValue.replace(/[^0-9.]/g, ''));

            if (isNaN(numericValue)) {
                throw new Error('Valor inválido');
            }

            const updateData: Record<string, string | number | null> = {
                total_value: numericValue,
                payment_method: paymentMethod,
                payment_status: 'paid',
            };

            if (selectedAssistantId !== 'none') {
                // Calculate commission based on rule (e.g. 15%)
                updateData.assistant_commission = numericValue * 0.15; // Example 15% rule
            }

            if (!event?.id) throw new Error('Evento inválido');

            const { error } = await supabase
                .from('events')
                .update(updateData)
                .eq('id', event.id);

            if (error) throw error;

            toast({
                title: "Atendimento Finalizado!",
                description: `Valor: R$ ${numericValue.toFixed(2)} | Status: Pago`,
            });

            onSuccess();
            onOpenChange(false);

        } catch (error) {
            logger.error(error, { message: 'Erro ao finalizar atendimento.', showToast: false });
            toast({
                title: "Erro ao finalizar",
                description: error instanceof Error ? error.message : "Erro desconhecido",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-serif">Finalizar Atendimento</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Confirme os valores e o pagamento para encerrar este agendamento.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">

                    <div className="grid gap-2">
                        <Label htmlFor="value" className="text-gray-300">Valor Total (R$)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                id="value"
                                value={totalValue}
                                onChange={(e) => setTotalValue(e.target.value)}
                                className="pl-9 bg-white/5 border-white/10 text-white"
                                placeholder="0.00"
                                type="number"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="method" className="text-gray-300">Forma de Pagamento</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a0a0a] border-white/10">
                                <SelectItem value="pix">Pix</SelectItem>
                                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                <SelectItem value="cash">Dinheiro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="assistant" className="text-gray-300">Assistente Responsável</Label>
                        <Select value={selectedAssistantId} onValueChange={setSelectedAssistantId}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Selecione (opcional)" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a0a0a] border-white/10">
                                <SelectItem value="none">Nenhum / Eu mesma</SelectItem>
                                {assistants.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedAssistantId !== 'none' && (
                            <p className="text-xs text-[#00e5ff]">
                                * Comissão estimada: 15%
                            </p>
                        )}
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-white hover:bg-white/5">
                        Cancelar
                    </Button>
                    <Button onClick={handleFinish} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Pagamento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
