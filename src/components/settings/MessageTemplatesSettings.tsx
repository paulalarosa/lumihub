
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { MessageTemplateService, TemplateType } from '@/services/messageTemplateService';
import { MessageSquare, Save, RefreshCw, Phone, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
    const { user } = useAuth();
    const { organizationId } = useOrganization();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [userPhone, setUserPhone] = useState<string>('');

    const [templates, setTemplates] = useState<Record<TemplateType, string>>({
        confirmation: '',
        reminder_24h: '',
        thanks: ''
    });

    useEffect(() => {
        fetchUserPhone();
        loadTemplates();
    }, [fetchUserPhone, loadTemplates]);

    const fetchUserPhone = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('phone')
            .eq('id', user.id)
            .single();

        const profile = data;
        if (profile?.phone) {
            setUserPhone(profile.phone);
        }
    };

    const loadTemplates = async () => {
        setLoading(true);
        try {
            // First load defaults
            const loaded: Record<TemplateType, string> = { ...DEFAULT_TEMPLATES };

            // Then try to fetch from Supabase
            const { data, error } = await supabase
                .from('message_templates')
                .select('*')
                .eq('organization_id', organizationId);

            if (data && !error) {
                data.forEach(t => {
                    if (t.content && t.type) loaded[t.type] = t.content;
                });
            }

            setTemplates(loaded);
        } catch (error) {
            console.error('Error loading templates:', error);
            toast({ title: 'Erro ao carregar modelos', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async (type: TemplateType, content: string) => {
        setSaving(type);
        try {
            const { error } = await supabase
                .from('message_templates')
                .upsert(
                    {
                        organization_id: organizationId,
                        type,
                        content,
                        updated_at: new Date().toISOString(),
                        user_id: user?.id || ''
                    },
                    { onConflict: 'organization_id,type' }
                );

            if (error) throw error;

            toast({ title: 'Modelo salvo com sucesso!' });
        } catch (error) {
            console.error(error);
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

    if (loading) return <div className="p-8 text-center text-muted-foreground font-mono uppercase">Carregando modelos...</div>;

    return (
        <Card className="border-border bg-card rounded-none shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    Modelos de Mensagem
                </CardTitle>
                <CardDescription className="font-mono text-xs uppercase tracking-widest">
                    CONFIGURAÇÃO WHATSAPP API
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: TEMPLATES */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="h-5 w-5 text-zinc-400" />
                            <h3 className="text-lg font-semibold text-foreground">Modelos de Mensagem</h3>
                        </div>

                        <div className="bg-muted/10 border border-border p-4 mb-6">
                            <p className="text-xs font-mono text-muted-foreground uppercase mb-2">Variáveis de Sistema</p>
                            <div className="flex flex-wrap gap-2">
                                {['{client_name}', '{date}', '{time}', '{location}', '{professional_name}'].map(v => (
                                    <span key={v} className="px-2 py-1 bg-background border border-border text-[10px] font-mono text-foreground">
                                        {v}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {(Object.keys(LABELS) as TemplateType[]).map((type) => (
                            <div key={type} className="space-y-3 p-6 border border-border bg-background/50">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="font-mono text-[10px] uppercase text-foreground tracking-widest border-l-2 border-foreground pl-3">
                                        {LABELS[type]}
                                    </Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleReset(type)}
                                        className="rounded-none h-6 px-2 hover:bg-destructive/10 hover:text-destructive"
                                        title="RESET"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                    </Button>
                                </div>
                                <Textarea
                                    value={templates[type]}
                                    onChange={(e) => setTemplates(prev => ({ ...prev, [type]: e.target.value }))}
                                    rows={3}
                                    className="resize-none rounded-none border-border bg-black focus-visible:ring-0 focus-visible:border-foreground"
                                />
                                <div className="flex justify-end pt-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleSaveTemplate(type, templates[type])}
                                        disabled={saving === type}
                                        className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-[10px] uppercase tracking-widest h-8 px-6"
                                    >
                                        {saving === type ? 'SALVANDO...' : 'SALVAR_MODELO'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT COLUMN: CONNECTION & TEST */}
                    <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 h-fit">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                            <Phone className="text-green-500 h-5 w-5" /> Conexão
                        </h3>

                        <div className="space-y-4">
                            <p className="text-sm text-zinc-400">
                                Atualmente operando em modo <strong>Click-to-Send</strong>.
                                O sistema abrirá o seu WhatsApp App ou Web pronto para enviar.
                            </p>

                            {/* TEST BUTTON */}
                            <div className="p-4 bg-zinc-800/50 rounded border border-zinc-700">
                                <h4 className="font-medium text-sm mb-2 text-white">Testar Integração</h4>
                                <p className="text-xs text-zinc-500 mb-3">
                                    Enviaremos uma mensagem de teste para o seu próprio número.
                                </p>
                                <Button
                                    onClick={() => {
                                        if (!userPhone) {
                                            toast({ title: "Seu perfil não tem telefone cadastrado", variant: "destructive" });
                                            return;
                                        }
                                        const text = encodeURIComponent("Olá! O sistema do KONTROL está conectado com sucesso! 🚀");
                                        window.open(`https://wa.me/${userPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
                                    }}
                                    disabled={!userPhone}
                                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors h-auto"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Testar Envio Agora
                                </Button>
                                {!userPhone && (
                                    <p className="text-[10px] text-red-400 mt-2">
                                        * Adicione um telefone ao seu perfil para testar.
                                    </p>
                                )}
                            </div>

                            <div className="text-xs text-zinc-500 mt-4 border-t border-zinc-800 pt-4">
                                * Para envios 100% automáticos sem abrir o app, será necessária a integração via API (Fase 2).
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
