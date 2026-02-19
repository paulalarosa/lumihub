import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export const ConflictResolver = () => {
    const { data: conflicts, refetch } = useQuery({
        queryKey: ['sync-conflicts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sync_conflicts')
                .select('*, event:calendar_events(*)')
                .eq('resolved', false)
                .order('created_at', { ascending: false });

            if (error) {
                logger.error(error, 'ConflictResolver.fetchConflicts', { showToast: false });
                return [];
            }
            return data;
        },
        refetchInterval: 30000, // Check a cada 30s
    });

    const handleResolve = async (conflictId: string, resolution: 'khaos' | 'google') => {
        // Placeholder for manual resolution logic
        // For now, we just mark as resolved manually
        const { error } = await supabase
            .from('sync_conflicts')
            .update({
                resolved: true,
                resolution: 'manual',
                resolved_at: new Date().toISOString()
            })
            .eq('id', conflictId);

        if (error) {
            toast.error("Erro ao resolver conflito");
        } else {
            toast.success("Conflito marcado como resolvido");
            refetch();
        }
    }

    if (!conflicts || conflicts.length === 0) return null;

    return (
        <Alert className="bg-yellow-900/20 border-yellow-500 mb-6">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div className="flex flex-col gap-2 w-full">
                <div>
                    <AlertTitle className="text-yellow-400 font-semibold flex items-center gap-2">
                        Conflitos de Sincronização Detectados
                        <span className="text-xs bg-yellow-500/20 px-2 py-0.5 rounded text-yellow-300">
                            {conflicts.length}
                        </span>
                    </AlertTitle>
                    <AlertDescription className="text-yellow-200/80 mt-1">
                        Alguns eventos foram modificados simultaneamente no Khaos e Google Calendar.
                        O sistema tentou resolver automaticamente, mas requer sua atenção.
                    </AlertDescription>
                </div>

                <div className="flex gap-2 mt-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                        onClick={() => toast.info("Funcionalidade de resolução manual em breve")}
                    >
                        Ver Detalhes
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30"
                        onClick={() => refetch()}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                    </Button>
                </div>
            </div>
        </Alert>
    );
};
