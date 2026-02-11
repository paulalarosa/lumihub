
import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, User, DollarSign, CalendarCheck } from 'lucide-react';
import { UpgradeCard } from '@/components/features/assistants/UpgradeCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AssistantDashboard() {
    const { user } = useAuth();
    const { isAssistant, loading: roleLoading } = useRole();
    const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

    // Fetch Assistant Profile ID
    const { data: assistantProfile } = useQuery({
        queryKey: ['assistant-profile', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data } = await supabase.from('assistants').select('id, full_name').eq('user_id', user.id).single();
            return data;
        },
        enabled: !!user
    });

    const assistantId = assistantProfile?.id;

    // Fetch connections (Makeup Artists)
    const { data: connections, isLoading: connectionsLoading } = useQuery({
        queryKey: ['assistant-connections', assistantId],
        queryFn: async () => {
            if (!assistantId) return [];

            const { data, error } = await supabase
                .from('assistant_access')
                .select(`
                  makeup_artist_id,
                  makeup_artist:makeup_artists (id, business_name, phone)
              `)
                .eq('assistant_id', assistantId)
                .eq('status', 'active');

            if (error) throw error;

            // Flatten structure safely
            return (data || []).map(item => ({
                id: item.makeup_artist?.id,
                name: item.makeup_artist?.business_name,
                phone: item.makeup_artist?.phone
            })).filter(item => item.id); // Ensure valid
        },
        enabled: !!assistantId
    });

    // Set default selected artist
    useEffect(() => {
        if (connections && connections.length > 0 && !selectedArtistId) {
            setSelectedArtistId(connections[0].id);
        }
    }, [connections]);

    // Fetch Appointments
    const { data: appointments, isLoading: appointmentsLoading } = useQuery({
        queryKey: ['assistant-appointments', assistantId, selectedArtistId],
        queryFn: async () => {
            if (!assistantId || !selectedArtistId) return [];

            // 1. Get the Pro's AUTH ID from makeup_artists table
            const { data: artistData, error: artistError } = await supabase
                .from('makeup_artists')
                .select('user_id')
                .eq('id', selectedArtistId)
                .single();

            if (artistError || !artistData) throw new Error('Artist not found');

            const proAuthId = artistData.user_id;

            // 2. Query appointments
            const { data: apps, error: appError } = await supabase
                .from('appointments')
                .select('*')
                .eq('assistant_id', assistantId)
                .eq('user_id', proAuthId) // Match Pro Auth ID
                .order('start_time', { ascending: true });

            if (appError) throw appError;

            return apps || [];
        },
        enabled: !!assistantId && !!selectedArtistId
    });

    if (roleLoading || connectionsLoading) return <div className="h-screen flex justify-center items-center"><LoadingSpinner /></div>;

    if (!isAssistant) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <h2 className="text-xl font-bold text-destructive mb-2">Acesso Restrito</h2>
                <p className="text-muted-foreground">Esta área é exclusiva para assistentes cadastradas.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Olá, {assistantProfile?.full_name?.split(' ')[0]}</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4" />
                        Sua agenda de assistente
                    </p>
                </div>
                <div className="hidden md:block">
                </div>
            </header>

            <div className="grid md:grid-cols-[1fr_300px] gap-6">
                <div className="space-y-6">
                    {connections && connections.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-card shadow-sm">
                            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Nenhuma conexão ativa</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Você ainda não foi convidada por nenhuma maquiadora. Solicite um convite para começar.</p>
                        </div>
                    ) : (
                        <Tabs value={selectedArtistId || ''} onValueChange={setSelectedArtistId} className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <TabsList className="bg-muted p-1 h-auto flex flex-wrap gap-1 justify-start rounded-lg">
                                    {connections?.map(artist => (
                                        <TabsTrigger
                                            key={artist.id}
                                            value={artist.id}
                                            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 rounded-md transition-all"
                                        >
                                            {artist.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            <TabsContent value={selectedArtistId || ''} className="space-y-4 mt-0">
                                {appointmentsLoading ? (
                                    <div className="py-12 flex justify-center"><LoadingSpinner /></div>
                                ) : appointments && appointments.length === 0 ? (
                                    <div className="text-center py-16 border rounded-lg bg-card/50 border-dashed">
                                        <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-30" />
                                        <p className="text-muted-foreground">Nenhum agendamento encontrado para esta maquiadora.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                                        {appointments?.map(app => (
                                            <Card key={app.id} className="hover:shadow-md transition-all duration-200 border-border/50 hover:border-border">
                                                <CardHeader className="pb-3 pt-4 px-4 bg-muted/20 border-b border-border/30">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">{app.title}</CardTitle>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold shrink-0 ${app.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            app.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}>
                                                            {app.status === 'confirmed' ? 'Confirmado' : app.status === 'completed' ? 'Concluído' : app.status}
                                                        </span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 space-y-3 text-sm">
                                                    <div className="flex items-center gap-2.5 text-foreground/80">
                                                        <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
                                                        <span className="font-medium capitalize">{format(new Date(app.start_time), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 text-muted-foreground">
                                                        <Clock className="w-4 h-4 shrink-0" />
                                                        <span>
                                                            {format(new Date(app.start_time), 'HH:mm')} - {format(new Date(app.end_time), 'HH:mm')}
                                                        </span>
                                                    </div>
                                                    {app.location && (
                                                        <div className="flex items-center gap-2.5 text-muted-foreground">
                                                            <MapPin className="w-4 h-4 shrink-0" />
                                                            <span className="truncate" title={app.location}>{app.location}</span>
                                                        </div>
                                                    )}
                                                    {app.assistant_commission > 0 && (
                                                        <div className="pt-2 mt-2 border-t border-border/30 flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
                                                            <DollarSign className="w-4 h-4" />
                                                            <span>Comissão: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.assistant_commission)}</span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>

                {/* Sidebar / Upsell */}
                <div className="space-y-6">
                    <UpgradeCard />
                    {/* Could add Profile summary or stats here */}
                </div>
            </div>
        </div>
    );
};
