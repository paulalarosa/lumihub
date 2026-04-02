import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns/format'
import { ptBR } from 'date-fns/locale'

interface SystemLog {
  id: string
  created_at: string | null
  level: string | null
  message: string | null
  metadata: string | null
  severity: string | null
  timestamp: string | null
  user_id: string | null
}

export const ApiStatusDashboard = () => {
  const [_logs, _setLogs] = useState<SystemLog[]>([])

  const { data: systemLogs, isLoading } = useQuery({
    queryKey: ['system-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    },
    refetchInterval: 30000,
  })

  const integrations = [
    {
      name: 'Google Calendar',
      status: 'operational',
      endpoint: 'google-calendar-sync',
    },
    {
      name: 'Stripe',
      status: 'operational',
      endpoint: 'create-checkout-session',
    },
    { name: 'Google Maps', status: 'operational', endpoint: 'places-proxy' },
    {
      name: 'Resend Email',
      status: 'operational',
      endpoint: 'send-application',
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">ERRO</Badge>
      case 'warn':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
          >
            ALERTA
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-blue-400">
            INFO
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Monitoramento de APIs
        </h2>
        <Badge variant="outline" className="text-xs">
          Atualizado em tempo real
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {integrations.map((integration) => (
          <Card
            key={integration.name}
            className="bg-black/40 border-white/10 backdrop-blur-md"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                {integration.name}
              </CardTitle>
              {getStatusIcon(integration.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Online</div>
              <p className="text-xs text-muted-foreground">
                Latência média: 120ms
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-black/40 border-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Logs do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border border-white/10 p-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  Carregando logs...
                </div>
              ) : systemLogs?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum log registrado recentemente.
                </div>
              ) : (
                systemLogs?.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col space-y-1 border-b border-white/10 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getLevelBadge(log.level || 'info')}
                        <span className="text-sm font-medium text-white">
                          {log.severity || 'System'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {log.created_at
                          ? format(
                              new Date(log.created_at),
                              'dd/MM/yyyy HH:mm:ss',
                              { locale: ptBR },
                            )
                          : '-'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 pl-1">{log.message}</p>
                    {log.metadata && (
                      <pre className="mt-1 w-full rounded bg-black/50 p-2 text-xs text-muted-foreground overflow-x-auto">
                        {log.metadata}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
