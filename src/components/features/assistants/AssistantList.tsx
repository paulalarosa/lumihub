
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Copy } from 'lucide-react';

export const AssistantList = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    // Fetch Makeup Artist ID
    const { data: makeupArtist } = useQuery({
        queryKey: ['makeup-artist-profile', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data } = await supabase.from('makeup_artists').select('id').eq('user_id', user.id).single();
            return data;
        },
        enabled: !!user
    });

    const makeupArtistId = makeupArtist?.id;

    const { data: assistantsData, isLoading, refetch } = useQuery({
        queryKey: ['assistants-list', makeupArtistId],
        queryFn: async () => {
            // Fetch ACTIVE connections
            // Using simple join syntax if relationships are set up correctly in Supabase.
            // assistant_access has FK to assistants.
            const { data: accessData, error } = await supabase
                .from('assistant_access')
                .select(`
                    id, status, created_at,
                    assistant:assistants (id, full_name, phone)
                `)
                .eq('makeup_artist_id', makeupArtistId)
                .eq('status', 'active');

            if (error) {
                console.error('Error fetching assistants:', error);
                throw error;
            }

            // Fetch PENDING invites
            const { data: invitesData, error: inviteError } = await supabase
                .from('assistant_invites')
                .select('*')
                .eq('makeup_artist_id', makeupArtistId)
                .eq('status', 'pending');

            if (inviteError) throw inviteError;

            return {
                active: accessData || [],
                pending: invitesData || []
            };
        },
        enabled: !!makeupArtistId
    });

    const handleRevoke = async (accessId: string) => {
        try {
            const { error } = await supabase
                .from('assistant_access')
                .update({ status: 'revoked', revoked_at: new Date().toISOString() })
                .eq('id', accessId);

            if (error) throw error;
            toast({ title: 'Acesso revogado.' });
            refetch();
        } catch (e) {
            toast({ title: 'Erro ao revogar', description: e.message, variant: 'destructive' });
        }
    };

    const handleCancelInvite = async (inviteId: string) => {
        try {
            const { error } = await supabase
                .from('assistant_invites')
                .update({ status: 'declined' })
                .eq('id', inviteId);

            if (error) throw error;
            toast({ title: 'Convite cancelado.' });
            refetch();
        } catch (e) {
            toast({ title: 'Erro ao cancelar', description: e.message, variant: 'destructive' });
        }
    };

    const copyInviteLink = (token: string) => {
        const link = `${window.location.origin}/assistant/accept/${token}`;
        navigator.clipboard.writeText(link);
        toast({ title: 'Link copiado!' });
    };

    if (isLoading || !makeupArtistId) return <LoadingSpinner />;

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Assistentes Ativas</h3>
                <div className="border rounded-md bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assistantsData?.active.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.assistant?.full_name || 'N/A'}</TableCell>
                                    <TableCell>{item.assistant?.phone || '-'}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Ativo
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleRevoke(item.id)} title="Revogar Acesso">
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {assistantsData?.active.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        Nenhuma assistente ativa. Convide alguém acima.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Convites Pendentes</h3>
                <div className="border rounded-md bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Enviado em</TableHead>
                                <TableHead>Expira em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assistantsData?.pending.map((invite) => (
                                <TableRow key={invite.id}>
                                    <TableCell className="font-mono text-xs">{invite.assistant_email}</TableCell>
                                    <TableCell>{new Date(invite.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(invite.expires_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => copyInviteLink(invite.invite_token)} title="Copiar Link">
                                            <Copy className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleCancelInvite(invite.id)} title="Cancelar Convite">
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {assistantsData?.pending.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        Nenhum convite pendente.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};
