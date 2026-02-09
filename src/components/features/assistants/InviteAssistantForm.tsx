
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, CheckCircle, Copy, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface InviteAssistantFormProps {
    onSuccess?: () => void;
}

export const InviteAssistantForm = ({ onSuccess }: InviteAssistantFormProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [makeupArtistId, setMakeupArtistId] = useState<string | null>(null);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [existingAssistant, setExistingAssistant] = useState(false);

    useEffect(() => {
        if (user) {
            supabase.from('makeup_artists').select('id').eq('user_id', user.id).single()
                .then(({ data }) => {
                    if (data) setMakeupArtistId(data.id);
                });
        }
    }, [user]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!makeupArtistId || !email) return;

        setLoading(true);
        setError(null);
        setInviteLink(null);
        setExistingAssistant(false);

        try {
            // 1. Verify existence properly
            const { data: checkData, error: checkError } = await supabase
                .rpc('check_assistant_exists', { p_email: email });

            if (checkError) throw checkError;

            const { data, error } = await supabase.rpc('create_assistant_invite', {
                p_makeup_artist_id: makeupArtistId,
                p_assistant_email: email
            });

            if (error) throw error;

            if (data.success) {
                setInviteLink(data.invite_link);

                // 2. Send email notification
                await sendInviteEmail(email, data.invite_link, data.invite_id);

                toast({ title: 'Convite criado e enviado por email!' });
                if (onSuccess) onSuccess();
            } else {
                setError(data.error || 'Erro ao criar convite');
                if (data.existing_assistant) {
                    setExistingAssistant(true);
                }
            }
        } catch (err) {
            setError(err.message);
            toast({ title: 'Erro', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const sendInviteEmail = async (recipientEmail: string, inviteLink: string, inviteId: string) => {
        try {
            // Get makeup artist name
            const { data: userData } = await supabase.auth.getUser();
            const makeupArtistName = userData?.user?.user_metadata?.full_name ||
                userData?.user?.email?.split('@')[0] ||
                'Uma maquiadora';

            // Call Edge Function to send email
            const { data, error } = await supabase.functions.invoke('send-invite-email', {
                body: {
                    to: recipientEmail,
                    makeup_artist_name: makeupArtistName,
                    invite_link: inviteLink,
                    invite_id: inviteId,
                },
            });

            if (error) {
                console.error('Email sending error:', error);
                toast({
                    title: 'Aviso',
                    description: 'Convite criado, mas o email não foi enviado. Compartilhe o link manualmente.',
                    variant: 'default',
                });
            } else if (data?.success) {
                console.log('Email sent successfully:', data.email_id);
            }
        } catch (err: any) {
            console.error('Email sending failed:', err);
            // Don't throw - email is optional, invite was already created
        }
    };

    const copyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            toast({ title: 'Link copiado!' });
        }
    };

    if (!makeupArtistId) {
        return null;
    }

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-card">
            <h3 className="text-lg font-medium">Convidar Assistente</h3>
            <p className="text-sm text-muted-foreground">Envie um convite para adicionar um assistente à sua equipe.</p>

            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                <Input
                    type="email"
                    placeholder="Email da assistente"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                    {loading ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                    Convidar
                </Button>
            </form>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>
                        {existingAssistant ? "Esta assistente já tem acesso à sua conta." : error}
                    </AlertDescription>
                </Alert>
            )}

            {inviteLink && (
                <Alert className="bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Convite Criado</AlertTitle>
                    <AlertDescription>
                        <div className="mt-2 flex items-center gap-2">
                            <code className="bg-background/50 p-2 rounded text-xs flex-1 truncate select-all font-mono border">
                                {inviteLink}
                            </code>
                            <Button variant="outline" size="icon" onClick={copyLink} className="h-8 w-8 shrink-0">
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};
