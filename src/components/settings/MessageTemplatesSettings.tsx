
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { MessageTemplateService, TemplateType } from '@/services/messageTemplateService';
import { MessageSquare, Save, RefreshCw } from 'lucide-react';

const DEFAULT_TEMPLATES: Record<TemplateType, string> = {
    confirmation: "Olá {client_name}! Sou da equipe da {professional_name}. Gostaria de confirmar seu agendamento para {date} às {time} em {location}. Podemos confirmar?",
    reminder_24h: "Oi {client_name}! Passando para lembrar do nosso agendamento amanhã ({date}) às {time}. Ansiosa para te atender! Qualquer imprevisto, me avise.",
    thanks: "Obrigada pela confiança, {client_name}! Foi um prazer te atender. Se puder, compartilhe sua experiência no Google: {link}. Até a próxima!"
};

const LABELS: Record<TemplateType, string> = {
    confirmation: 'Confirmação de Agendamento',
    reminder_24h: 'Lembrete de 24h',
    thanks: 'Agradecimento Pós-Atendimento'
};

export default function MessageTemplatesSettings() {
    const { organizationId } = useOrganization();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const [templates, setTemplates] = useState<Record<TemplateType, string>>({
        confirmation: '',
        reminder_24h: '',
        thanks: ''
    });

    useEffect(() => {
        if (organizationId) {
            loadTemplates();
        }
    }, [organizationId]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await MessageTemplateService.getTemplates(organizationId!);

            const loaded: any = { ...DEFAULT_TEMPLATES };
            data.forEach(t => {
                if (t.content) loaded[t.type] = t.content;
            });

            setTemplates(loaded);
        } catch (error) {
            console.error('Error loading templates:', error);
            toast({ title: 'Erro ao carregar modelos', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (type: TemplateType) => {
        setSaving(type);
        try {
            await MessageTemplateService.updateTemplate(organizationId!, type, templates[type]);
            toast({ title: 'Modelo salvo com sucesso!' });
        } catch (error) {
            toast({ title: 'Erro ao salvar modelo', variant: 'destructive' });
        } finally {
            setSaving(null);
        }
    };

    const handleReset = (type: TemplateType) => {
        if (confirm('Deseja restaurar o modelo padrão?')) {
            setTemplates(prev => ({ ...prev, [type]: DEFAULT_TEMPLATES[type] }));
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando modelos...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Modelos de Mensagem (WhatsApp)
                </CardTitle>
                <CardDescription>
                    Personalize as mensagens automáticas enviadas para as clientes via WhatsApp.
                    <br />
                    Variáveis disponíveis: {'{client_name}'}, {'{date}'}, {'{time}'}, {'{location}'}, {'{professional_name}'}.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {(Object.keys(LABELS) as TemplateType[]).map((type) => (
                    <div key={type} className="space-y-2 p-4 border border-border rounded-lg bg-card/50">
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-base font-semibold">{LABELS[type]}</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReset(type)}
                                title="Restaurar Padrão"
                            >
                                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                        <Textarea
                            value={templates[type]}
                            onChange={(e) => setTemplates(prev => ({ ...prev, [type]: e.target.value }))}
                            rows={3}
                            className="resize-none"
                        />
                        <div className="flex justify-end pt-2">
                            <Button
                                size="sm"
                                onClick={() => handleSave(type)}
                                disabled={saving === type}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {saving === type ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
