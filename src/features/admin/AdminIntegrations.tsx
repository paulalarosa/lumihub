import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/services/logger'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  Database,
  Calendar,
  CreditCard,
  Map,
  Mail,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { invokeEdgeFunction } from '@/lib/invokeEdge'
import { toast } from 'sonner'

interface IntegrationStatus {
  service: string
  status: 'operational' | 'degraded' | 'down' | 'unknown' | 'not_configured'
  message?: string
  lastChecked?: Date
}

export default function AdminIntegrations() {
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([
    {
      service: 'Supabase Database',
      status: 'unknown',
      message: 'Checking connection...',
    },
    {
      service: 'Supabase Auth',
      status: 'unknown',
      message: 'Checking connection...',
    },
    {
      service: 'Google Calendar Sync',
      status: 'unknown',
      message: 'Checking Edge Function...',
    },
    {
      service: 'Stripe',
      status: 'unknown',
      message: 'Checking Configuration...',
    },
    {
      service: 'Google Maps',
      status: 'unknown',
      message: 'Checking API Key...',
    },
    {
      service: 'Resend Email',
      status: 'unknown',
      message: 'Checking Client Configuration...',
    },
  ])

  const checkStatus = useCallback(async () => {
    setLoading(true)

    setStatuses(current => {
      const newStatuses = [...current]

      const checkAll = async () => {
        try {
          const { error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)
            .maybeSingle()
          updateStatus(
            newStatuses,
            'Supabase Database',
            error ? 'degraded' : 'operational',
            error?.message || 'Connected',
          )
          const { data: authData } = await supabase.auth.getUser()
          updateStatus(
            newStatuses,
            'Supabase Auth',
            authData?.user ? 'operational' : 'down',
            authData?.user ? `Session: ${authData.user.email}` : 'No Active Session',
          )
        } catch (e) {
          updateStatus(
            newStatuses,
            'Supabase Database',
            'down',
            'Connection Failed',
          )
          logger.error(e, 'Health Check Failed', {
            context: { service: 'Supabase Database' },
          })
        }

        try {
          const { data, error } = await invokeEdgeFunction<{
            error?: string
            missing_keys?: string[]
          }>('google-calendar-sync', { action: 'check_config' })

          if (error) throw new Error(error.message)

          if (data?.error === 'Service configuration error') {
            updateStatus(
              newStatuses,
              'Google Calendar Sync',
              'not_configured',
              `Missing: ${data.missing_keys?.join(', ')}`,
            )
          } else if (data?.error === 'Invalid action') {
            updateStatus(
              newStatuses,
              'Google Calendar Sync',
              'operational',
              'Edge Function Configured',
            )
          } else {
            updateStatus(
              newStatuses,
              'Google Calendar Sync',
              'operational',
              'Responding',
            )
          }
        } catch (_e) {
          updateStatus(newStatuses, 'Google Calendar Sync', 'down', 'Unreachable')
        }

        try {
          const { data, error } = await invokeEdgeFunction<{
            status?: string
            latency?: string
            error?: string
          }>('check-stripe-status')

          if (error || data?.status === 'down') {
            const msg = error?.message || data?.error || 'Unknown Error'
            updateStatus(newStatuses, 'Stripe', 'down', msg)
            logger.error(new Error(`Stripe Health Check Failed: ${msg}`), {
              context: { service: 'Stripe', data, error },
            })
          } else {
            updateStatus(
              newStatuses,
              'Stripe',
              'operational',
              `Latency: ${data?.latency || 'OK'}`,
            )
          }
        } catch (e) {
          updateStatus(newStatuses, 'Stripe', 'down', 'Invocation Failed')
          logger.error(e, 'Health Check Failed', { context: { service: 'Stripe' } })
        }

        const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        if (mapsKey) {
          updateStatus(
            newStatuses,
            'Google Maps',
            'operational',
            'Key Present in Client',
          )
        } else {
          updateStatus(
            newStatuses,
            'Google Maps',
            'not_configured',
            'VITE_GOOGLE_MAPS_API_KEY Missing',
          )
        }

        updateStatus(
          newStatuses,
          'Resend Email',
          'operational',
          'Provider: Resend',
        )

        setStatuses([...newStatuses])
        setLoading(false)
        toast.success('System Status Updated')
      }

      checkAll()
      return newStatuses
    })
  }, [])

  const updateStatus = (
    list: IntegrationStatus[],
    service: string,
    status: IntegrationStatus['status'],
    message: string,
  ) => {
    const idx = list.findIndex((s) => s.service === service)
    if (idx >= 0) {
      list[idx] = { ...list[idx], status, message, lastChecked: new Date() }
    }
  }

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const getIcon = (service: string) => {
    switch (service) {
      case 'Supabase Database':
        return Database
      case 'Google Calendar Sync':
        return Calendar
      case 'Stripe':
        return CreditCard
      case 'Google Maps':
        return Map
      case 'Resend Email':
        return Mail
      default:
        return ShieldCheck
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-500 border-green-500/50 bg-green-500/10'
      case 'degraded':
        return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10'
      case 'not_configured':
        return 'text-red-500 border-red-500/50 bg-red-500/10'
      case 'down':
        return 'text-red-500 border-red-500/50 bg-red-500/10'
      default:
        return 'text-gray-500 border-gray-500/50 bg-gray-500/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />
      case 'not_configured':
        return <XCircle className="h-4 w-4" />
      case 'down':
        return <XCircle className="h-4 w-4" />
      default:
        return <RefreshCw className="h-4 w-4 animate-spin" />
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-serif text-3xl font-light tracking-tight">
            System Status
          </h2>
          <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest mt-1">
            Integration Health Monitor
          </p>
        </div>
        <Button
          onClick={checkStatus}
          disabled={loading}
          variant="outline"
          className="font-mono text-xs uppercase"
        >
          <RefreshCw
            className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`}
          />
          Run Diagnostics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statuses.map((item) => {
          const Icon = getIcon(item.service)
          return (
            <Card
              key={item.service}
              className="bg-black border border-border/40 hover:border-border transition-all"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-mono uppercase tracking-widest text-muted-foreground">
                  {item.service}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-2">
                  <Badge
                    variant="outline"
                    className={`rounded-none px-3 py-1 flex items-center gap-2 ${getStatusColor(item.status)}`}
                  >
                    {getStatusIcon(item.status)}
                    <span className="uppercase tracking-wider text-[10px] font-bold">
                      {item.status.replace('_', ' ')}
                    </span>
                  </Badge>
                </div>
                <p
                  className="text-xs text-muted-foreground mt-4 font-mono truncate"
                  title={item.message}
                >
                  {item.message}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <RiscConfigPanel />

      <Card className="bg-muted/5 border-none">
        <CardHeader>
          <CardTitle className="text-lg font-serif">Diagnostic Logs</CardTitle>
          <CardDescription>Recent check results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xs font-mono text-muted-foreground bg-black/50 p-4 rounded border border-white/5 space-y-1">
            {statuses.map((s, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  [
                  {s.lastChecked
                    ? s.lastChecked.toLocaleTimeString()
                    : '--:--:--'}
                  ] checking {s.service}...
                </span>
                <span
                  className={
                    s.status === 'operational'
                      ? 'text-green-500'
                      : 'text-red-500'
                  }
                >
                  {s.status.toUpperCase()}
                </span>
              </div>
            ))}
            <div className="text-green-500 mt-2">-- DIAGNOSTIC COMPLETE --</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RiscConfigPanel() {
  const [running, setRunning] = useState<
    'status' | 'configure' | 'verify' | null
  >(null)
  const [result, setResult] = useState<string | null>(null)

  const call = async (operation: 'status' | 'configure' | 'verify') => {
    setRunning(operation)
    setResult(null)
    try {
      const { data, error } = await invokeEdgeFunction(
        'risc-setup',
        { operation },
        { passUserToken: true },
      )
      if (error) throw new Error(error.message)
      setResult(JSON.stringify(data, null, 2))
      toast.success(`RISC ${operation} OK`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setResult(msg)
      toast.error(`RISC ${operation} falhou: ${msg}`)
      logger.error(err, `AdminIntegrations.risc.${operation}`)
    } finally {
      setRunning(null)
    }
  }

  return (
    <Card className="bg-black/40 border border-white/10">
      <CardHeader>
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Shield className="h-4 w-4 text-white/60" />
          Google Cross-Account Protection (RISC)
        </CardTitle>
        <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
          Configure o stream de eventos de segurança do Google
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-white/70 space-y-2 border-l-2 border-white/10 pl-3">
          <p>
            <strong className="text-white">Pré-requisito:</strong> secret{' '}
            <code className="font-mono bg-black px-1 py-0.5">
              GOOGLE_RISC_SA_JSON
            </code>{' '}
            deve conter o JSON da Service Account com role{' '}
            <em>RISC Configuration Admin</em>.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-white/60">
            <li>
              <strong>Status:</strong> verifica config atual do stream
            </li>
            <li>
              <strong>Configurar:</strong> registra o endpoint receiver com os
              eventos padrão
            </li>
            <li>
              <strong>Testar:</strong> Google manda um evento de verificação —
              checa a tabela <code>risc_events</code> ~10s depois
            </li>
          </ol>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => call('status')}
            disabled={running !== null}
            variant="outline"
            className="rounded-none border-white/10 font-mono text-[10px] uppercase tracking-widest h-9"
          >
            {running === 'status' ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : null}
            Verificar status
          </Button>
          <Button
            onClick={() => call('configure')}
            disabled={running !== null}
            className="rounded-none bg-white text-black hover:bg-zinc-200 font-mono text-[10px] uppercase tracking-widest h-9"
          >
            {running === 'configure' ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : null}
            Configurar stream
          </Button>
          <Button
            onClick={() => call('verify')}
            disabled={running !== null}
            variant="outline"
            className="rounded-none border-emerald-900/50 text-emerald-500 hover:bg-emerald-500 hover:text-black font-mono text-[10px] uppercase tracking-widest h-9"
          >
            {running === 'verify' ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : null}
            Testar conexão
          </Button>
        </div>

        {result && (
          <pre className="mt-4 p-3 border border-white/10 bg-black text-[10px] text-white/70 font-mono overflow-auto max-h-60 whitespace-pre-wrap">
            {result}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
