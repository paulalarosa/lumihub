
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MessageCircle } from 'lucide-react';
import { generateWhatsAppLink } from '@/utils/whatsappGenerator';

interface Template {
    id: string;
    type: string;
    content: string;
    title?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    client: { name: string; phone: string };
    event: { date: string; time: string; location?: string };
    templates: Template[];
    professionalName?: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
    confirmation: 'Confirmação',
    reminder_24h: 'Lembrete (24h)',
    thanks: 'Agradecimento',
    custom: 'Personalizado'
};

export function WhatsAppPreviewModal({ isOpen, onClose, client, event, templates, professionalName = "KONTROL" }: Props) {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [messageText, setMessageText] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSelectedTemplateId('');
            setMessageText('');
        }
    }, [isOpen]);

    // 1. AUTO-FILL LOGIC
    useEffect(() => {
        if (selectedTemplateId && templates) {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (template) {
                const text = template.content
                    .replace(/{client_name}/g, client.name)
                    .replace(/{date}/g, new Date(event.date).toLocaleDateString('pt-BR'))
                    .replace(/{time}/g, event.time)
                    .replace(/{location}/g, event.location || "Local a combinar")
                    .replace(/{professional_name}/g, professionalName);

                setMessageText(text);
            }
        }
    }, [selectedTemplateId, client, event, templates, professionalName]);

    // 2. SEND ACTION
    const handleSend = () => {
        if (!client.phone) return;

        const encoded = encodeURIComponent(messageText);
        const phone = client.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}?text=${encoded}`, '_blank');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-white font-serif uppercase tracking-wide">
                        Enviar Mensagem para {client.name}
                    </DialogTitle>
                    <p className="text-zinc-500 text-xs">
                        Revise e personalize a mensagem antes de enviar.
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* SELETOR DE MODELO */}
                    <div className="space-y-2">
                        <Label className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Escolher Modelo</Label>
                        <Select
                            onValueChange={setSelectedTemplateId}
                            value={selectedTemplateId}
                        >
                            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white rounded-none font-mono text-xs uppercase">
                                <SelectValue placeholder="SELECIONE..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id} className="font-mono text-xs uppercase focus:bg-zinc-700">
                                        {t.title || TEMPLATE_LABELS[t.type] || t.type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ÁREA DE EDIÇÃO */}
                    <div className="space-y-2">
                        <Label className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Prévia da Mensagem (Editável)</Label>
                        <Textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="w-full h-32 p-3 bg-zinc-800 border-zinc-700 rounded-none text-sm font-sans text-white focus:border-zinc-500"
                            placeholder="Selecione um modelo acima ou escreva aqui..."
                        />
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                            * Você pode alterar o texto acima antes de enviar.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-none text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-xs uppercase tracking-widest"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={!messageText}
                        className="rounded-none bg-[#25D366] hover:bg-[#128C7E] text-white font-mono text-xs uppercase tracking-widest gap-2"
                    >
                        <MessageCircle className="h-4 w-4" />
                        Enviar via WhatsApp
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
