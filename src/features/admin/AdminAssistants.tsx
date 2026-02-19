import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AssistantProfile {
    id: string;
    email: string;
    full_name: string;
    created_at: string;
    role: string;
    connections: {
        professional_name: string;
        professional_email: string;
    }[];
}

export default function AdminAssistants() {
    const { toast } = useToast();
    const [assistants, setAssistants] = useState<AssistantProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchAssistants();
    }, []);

    const fetchAssistants = async () => {
        setLoading(true);
        try {
            // 1. Get all profiles with role 'assistant'
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'assistant');

            if (profileError) throw profileError;

            // 2. For each assistant, get their connections
            const enriched = await Promise.all(profiles.map(async (p) => {
                const { data: connections } = await supabase
                    .from('assistants')
                    .select('professional_id') // We assume this column exists, checking schema next
                    .eq('assistant_user_id', p.id);

                // Fetch professional details if connection exists
                const connectedPros = [];
                if (connections && connections.length > 0) {
                    const proIds = connections.map(c => c.professional_id);
                    const { data: pros } = await supabase
                        .from('profiles')
                        .select('full_name, email')
                        .in('id', proIds);
                    if (pros) connectedPros.push(...pros.map(pro => ({
                        professional_name: pro.full_name,
                        professional_email: pro.email
                    })));
                }

                return {
                    ...p,
                    connections: connectedPros
                };
            }));

            setAssistants(enriched);
        } catch (error) {
            logger.error(error, 'AdminAssistants.fetchAssistants', { showToast: false });
            toast({
                title: "Erro ao carregar assistentes",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            // 1. Delete all connections in 'assistants' table
            const { error: connError } = await supabase
                .from('assistants')
                .delete()
                .eq('assistant_user_id', deleteId);

            if (connError) throw connError;

            // 2. Delete the profile
            const { error: profError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', deleteId);

            if (profError) throw profError;

            // 3. UI Update
            setAssistants(prev => prev.filter(a => a.id !== deleteId));
            toast({
                title: "Assistente removida",
                description: "O cadastro e todos os vínculos foram apagados."
            });

        } catch (error) {
            logger.error(error, 'AdminAssistants.handleDelete', { showToast: false });
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível remover, verifique se existem outros registros dependentes.",
                variant: "destructive"
            });
        } finally {
            setDeleteId(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 font-mono text-xs uppercase animate-pulse">Carregando Assistentes...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-serif text-white">Gestão de Assistentes</h2>
                <Badge variant="outline" className="font-mono text-xs border-white/20 text-white">
                    {assistants.length} Cadastrados
                </Badge>
            </div>

            <div className="border border-white/10 rounded-none bg-black overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-gray-500 font-mono text-[10px] uppercase">Assistente</TableHead>
                            <TableHead className="text-gray-500 font-mono text-[10px] uppercase">Vínculos (Maquiadoras)</TableHead>
                            <TableHead className="text-right text-gray-500 font-mono text-[10px] uppercase">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assistants.map((assistant) => (
                            <TableRow key={assistant.id} className="border-white/5 hover:bg-white/5">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 rounded-none border border-white/10">
                                            <AvatarFallback className="bg-white/10 text-white text-xs">{assistant.full_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-white font-medium text-sm">{assistant.full_name}</div>
                                            <div className="text-gray-500 text-xs">{assistant.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {assistant.connections.length > 0 ? (
                                            assistant.connections.map((conn, idx) => (
                                                <Badge key={idx} variant="outline" className="w-fit border-white/10 text-gray-400 font-mono text-[10px]">
                                                    {conn.professional_name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-gray-600 text-xs italic">Sem vínculos</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-400 hover:bg-red-950/30 rounded-none"
                                        onClick={() => setDeleteId(assistant.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {assistants.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                                    Nenhuma assistente encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="bg-black border border-white/20 rounded-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white flex items-center gap-2">
                            <AlertTriangle className="text-red-500 h-5 w-5" />
                            Excluir Cadastro?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Esta ação removerá a assistente de <strong>todas</strong> as agendas conectadas. O acesso dela será revogado imediatamente.
                            <br /><br />
                            <span className="text-xs font-mono uppercase text-red-500">Ação irreversível.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none bg-transparent border-white/20 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-none bg-red-600 text-white hover:bg-red-700 font-bold uppercase tracking-widest"
                        >
                            Confirmar Exclusão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
