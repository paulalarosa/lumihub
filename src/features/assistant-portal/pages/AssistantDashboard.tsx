import { useState, useEffect } from 'react'
import { useRole } from '@/hooks/useRole'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from '@/components/ui/page-loader'
import { useAssistantEarnings } from '../hooks/useAssistantEarnings'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react'
import { UpgradeCard } from '@/features/assistants/components/UpgradeCard'
import { NotificationCenter } from '@/features/assistants/components/NotificationCenter'
import { EventActionButtons } from '@/features/assistants/components/EventActionButtons'
import { format } from 'date-fns/format'
import { ptBR } from 'date-fns/locale'

interface AssistantConnection {
  id: string
  name: string
  phone: string
}

export default function AssistantDashboard() {
  const { user } = useAuth()
  const { isAssistant, loading: roleLoading } = useRole()
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null)

  const { data: assistantProfile } = useQuery({
    queryKey: ['assistant-profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('assistants')
        .select('id, full_name')
        .eq('user_id', user.id)
        .maybeSingle()
      return data
    },
    enabled: !!user,
  })

  const assistantId = assistantProfile?.id

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['assistant-connections', assistantId],
    queryFn: async () => {
      if (!assistantId) return []
      const { data, error } = await supabase
        .from('assistant_access')
        .select(
          `
                  makeup_artist_id,
                  makeup_artist:makeup_artists (id, business_name, phone)
              `,
        )
        .eq('assistant_id', assistantId)
        .eq('status', 'active')

      if (error) throw error
      return (data || [])
        .map((item) => ({
          id: item.makeup_artist?.id,
          name: item.makeup_artist?.business_name,
          phone: item.makeup_artist?.phone,
        }))
        .filter((item): item is AssistantConnection => !!item.id)
    },
    enabled: !!assistantId,
  })

  const { data: earnings } = useAssistantEarnings(assistantId)

  useEffect(() => {
    if (connections && connections.length > 0 && !selectedArtistId) {
      setSelectedArtistId(connections[0].id)
    }
  }, [connections, selectedArtistId])

  const { data: artistEvents, isLoading: artistEventsLoading } = useQuery({
    queryKey: ['assistant-artist-events', assistantId, selectedArtistId],
    queryFn: async () => {
      if (!assistantId || !selectedArtistId) return []
      const { data: artistData, error: artistError } = await supabase
        .from('makeup_artists')
        .select('user_id')
        .eq('id', selectedArtistId)
        .maybeSingle()

      if (artistError || !artistData) throw new Error('Artist not found')
      const proAuthId = artistData.user_id

      const { data, error } = await supabase
        .from('event_assistants')
        .select(
          `
                    event_id,
                    assistant_id,
                    event:events(
                        id, title, event_date, start_time, end_time, location,
                        event_type, assistant_commission, status,
                        client:wedding_clients(name)
                    )
                `,
        )
        .eq('assistant_id', assistantId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).filter((item) => {
        const evt = item.event as Record<string, unknown> | null
        return evt && evt.user_id === proAuthId
      }) as Array<{
        event_id: string
        assistant_id: string
        status?: string
        event: Record<string, unknown> | null
      }>
    },
    enabled: !!assistantId && !!selectedArtistId,
  })

  const { data: assignedEvents } = useQuery({
    queryKey: ['assistant-events', assistantId],
    queryFn: async () => {
      if (!assistantId) return []
      const { data, error } = await supabase
        .from('event_assistants')
        .select(
          `
                    event_id,
                    assistant_id,
                    event:events(
                        id, title, event_date, start_time, location,
                        event_type, assistant_commission,
                        client:wedding_clients(name)
                    )
                `,
        )
        .eq('assistant_id', assistantId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return (data || []) as Array<{
        event_id: string
        assistant_id: string
        status?: string
        event: Record<string, unknown> | null
      }>
    },
    enabled: !!assistantId,
  })

  const formatCurrencyLocal = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  if (roleLoading || connectionsLoading) return <PageLoader />

  if (!isAssistant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <h2 className="text-xl font-bold text-destructive mb-2">
          Acesso Restrito
        </h2>
        <p className="text-muted-foreground">
          Esta área é exclusiva para assistentes cadastradas.
        </p>
      </div>
    )
  }

  const monthGrowth =
    earnings && earnings.lastMonth > 0
      ? ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100
      : 0

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Olá, {assistantProfile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            Sua agenda de assistente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
        </div>
      </header>

      {earnings && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Comissão Este Mês
                  </p>
                  <p className="text-2xl font-bold text-green-500 mt-1">
                    {formatCurrencyLocal(Number(earnings.thisMonth))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Eventos Este Mês
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {earnings.totalEvents}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Crescimento
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${monthGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {monthGrowth > 0 ? '+' : ''}
                    {monthGrowth.toFixed(0)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {assignedEvents && assignedEvents.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5" />
            Eventos Atribuídos
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {assignedEvents.map((assignment) => {
              const evt = assignment.event as Record<string, unknown> | null
              if (!evt) return null
              const clientData = evt.client as Record<string, string> | null
              return (
                <Card
                  key={`${assignment.event_id}-${assignment.assistant_id}`}
                  className="border-border/50"
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-sm font-semibold leading-tight">
                        {(evt.title as string) || 'Evento'}
                      </CardTitle>
                      <EventActionButtons
                        eventId={assignment.event_id}
                        assistantId={assignment.assistant_id}
                        currentStatus={assignment.status || 'pending'}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2 text-sm">
                    {evt.event_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>
                          {format(
                            new Date(evt.event_date as string),
                            "dd 'de' MMMM",
                            { locale: ptBR },
                          )}
                        </span>
                      </div>
                    )}
                    {clientData?.name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4 shrink-0" />
                        <span>{clientData.name}</span>
                      </div>
                    )}
                    {evt.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {evt.location as string}
                        </span>
                      </div>
                    )}
                    {(evt.assistant_commission as number) > 0 && (
                      <div className="pt-2 border-t border-border/30 flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
                        <DollarSign className="w-4 h-4" />
                        <span>
                          {formatCurrencyLocal(
                            evt.assistant_commission as number,
                          )}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {connections && connections.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-card shadow-sm">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">Nenhuma conexão ativa</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Você ainda não foi convidada por nenhuma maquiadora. Solicite um
                convite para começar.
              </p>
            </div>
          ) : (
            <Tabs
              value={selectedArtistId || ''}
              onValueChange={setSelectedArtistId}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-muted p-1 h-auto flex flex-wrap gap-1 justify-start rounded-lg">
                  {connections?.map((artist) => (
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

              <TabsContent
                value={selectedArtistId || ''}
                className="space-y-4 mt-0"
              >
                {artistEventsLoading ? (
                  <PageLoader />
                ) : artistEvents && artistEvents.length === 0 ? (
                  <div className="text-center py-16 border rounded-lg bg-card/50 border-dashed">
                    <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-30" />
                    <p className="text-muted-foreground">
                      Nenhum evento encontrado para esta maquiadora.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {artistEvents?.map((assignment) => {
                      const evt = assignment.event as Record<
                        string,
                        unknown
                      > | null
                      if (!evt) return null
                      const clientData = evt.client as Record<
                        string,
                        string
                      > | null
                      return (
                        <Card
                          key={`${assignment.event_id}-${assignment.assistant_id}`}
                          className="hover:shadow-md transition-all duration-200 border-border/50 hover:border-border"
                        >
                          <CardHeader className="pb-3 pt-4 px-4 bg-muted/20 border-b border-border/30">
                            <div className="flex justify-between items-start gap-2">
                              <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
                                {(evt.title as string) || 'Evento'}
                              </CardTitle>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold shrink-0 ${
                                  (evt.status as string) === 'confirmed'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : (evt.status as string) === 'completed'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                              >
                                {(evt.status as string) === 'confirmed'
                                  ? 'Confirmado'
                                  : (evt.status as string) === 'completed'
                                    ? 'Concluído'
                                    : (evt.status as string) || 'Pendente'}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3 text-sm">
                            {evt.event_date && (
                              <div className="flex items-center gap-2.5 text-foreground/80">
                                <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
                                <span className="font-medium capitalize">
                                  {format(
                                    new Date(evt.event_date as string),
                                    "EEEE, dd 'de' MMMM",
                                    { locale: ptBR },
                                  )}
                                </span>
                              </div>
                            )}
                            {evt.start_time && (
                              <div className="flex items-center gap-2.5 text-muted-foreground">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>
                                  {evt.start_time as string}
                                  {evt.end_time
                                    ? ` - ${evt.end_time as string}`
                                    : ''}
                                </span>
                              </div>
                            )}
                            {clientData?.name && (
                              <div className="flex items-center gap-2.5 text-muted-foreground">
                                <User className="w-4 h-4 shrink-0" />
                                <span>{clientData.name}</span>
                              </div>
                            )}
                            {evt.location && (
                              <div className="flex items-center gap-2.5 text-muted-foreground">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span
                                  className="truncate"
                                  title={String(evt.location)}
                                >
                                  {String(evt.location)}
                                </span>
                              </div>
                            )}
                            {(evt.assistant_commission as number) > 0 && (
                              <div className="pt-2 mt-2 border-t border-border/30 flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
                                <DollarSign className="w-4 h-4" />
                                <span>
                                  {formatCurrencyLocal(
                                    evt.assistant_commission as number,
                                  )}
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <div className="space-y-6">
          <UpgradeCard />
        </div>
      </div>
    </div>
  )
}

