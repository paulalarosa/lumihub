import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  UserPlus,
  CreditCard,
  Trash2,
  Zap,
  AlertCircle,
  ShieldCheck,
  Activity,
  RefreshCw,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useAdminActivity,
  type ActivityCategory,
  type ActivitySeverity,
} from '../hooks/useAdminActivity'

type FilterValue = ActivityCategory | 'all'

const CATEGORY_META: Record<
  ActivityCategory,
  { label: string; Icon: typeof UserPlus }
> = {
  signup: { label: 'Signups', Icon: UserPlus },
  payment: { label: 'Pagamentos', Icon: CreditCard },
  lgpd: { label: 'LGPD', Icon: Trash2 },
  workflow: { label: 'Workflows', Icon: Zap },
  admin: { label: 'Admin', Icon: ShieldCheck },
  system: { label: 'Sistema', Icon: AlertCircle },
}

const SEVERITY_BORDER: Record<ActivitySeverity, string> = {
  info: 'border-l-zinc-600',
  success: 'border-l-emerald-500',
  warning: 'border-l-yellow-500',
  error: 'border-l-red-500',
}

const SEVERITY_BADGE: Record<ActivitySeverity, string> = {
  info: 'bg-zinc-900 text-zinc-400',
  success: 'bg-emerald-950 text-emerald-400',
  warning: 'bg-yellow-950 text-yellow-400',
  error: 'bg-red-950 text-red-400',
}

const FILTERS: FilterValue[] = [
  'all',
  'signup',
  'payment',
  'lgpd',
  'workflow',
  'admin',
  'system',
]

export function AdminActivityPanel() {
  const { events, isLoading, refetch } = useAdminActivity()
  const [filter, setFilter] = useState<FilterValue>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return events
    return events.filter((e) => e.category === filter)
  }, [events, filter])

  const counts = useMemo(() => {
    const c: Record<FilterValue, number> = {
      all: events.length,
      signup: 0,
      payment: 0,
      lgpd: 0,
      workflow: 0,
      admin: 0,
      system: 0,
    }
    for (const e of events) c[e.category]++
    return c
  }, [events])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="bg-background border border-border rounded-none shadow-none">
        <CardHeader className="border-b border-border bg-zinc-900/30">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-white font-mono text-[11px] uppercase tracking-[0.3em] font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <Activity className="h-4 w-4" />
              Atividade em Tempo Real
            </CardTitle>
            <button
              onClick={() => refetch()}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Atualizar"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-3">
            {FILTERS.map((f) => {
              const label =
                f === 'all' ? 'TUDO' : CATEGORY_META[f].label.toUpperCase()
              const count = counts[f]
              const isActive = filter === f
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 font-mono text-[9px] uppercase tracking-widest border transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/50'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`${
                      isActive ? 'text-background/70' : 'text-zinc-600'
                    } text-[8px]`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
              Nenhuma atividade encontrada
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((e) => {
                const { Icon, label } = CATEGORY_META[e.category]
                const ts = e.timestamp
                  ? formatDistanceToNow(new Date(e.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })
                  : ''
                const content = (
                  <div
                    className={`border-l-2 ${SEVERITY_BORDER[e.severity]} px-4 py-3 hover:bg-white/5 transition-colors flex gap-3 items-start`}
                  >
                    <div className="h-8 w-8 bg-zinc-900 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest font-bold ${SEVERITY_BADGE[e.severity]}`}
                        >
                          {label}
                        </span>
                        <span className="text-white font-mono text-[11px] font-bold tracking-tight">
                          {e.title}
                        </span>
                        <span className="font-mono text-[9px] text-zinc-600">
                          {ts}
                        </span>
                      </div>
                      {e.description && (
                        <div className="text-[10px] text-zinc-500 font-mono mt-1 line-clamp-2">
                          {e.description}
                        </div>
                      )}
                    </div>
                  </div>
                )
                return e.link ? (
                  <Link key={e.id} to={e.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={e.id}>{content}</div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminActivityPanel
