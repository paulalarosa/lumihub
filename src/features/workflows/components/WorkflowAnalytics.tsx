import { Activity, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import {
  useWorkflowStats,
  type WorkflowExecutionRow,
} from '../hooks/useWorkflowStats'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'


export function WorkflowAnalytics() {
  const { stats, recent } = useWorkflowStats()

  const statsData = stats.data ?? []
  const recentData = recent.data ?? []

  const aggregate = statsData.reduce(
    (acc, s) => {
      acc.total_runs += s.total_runs
      acc.success_30d += s.success_30d
      acc.failure_30d += s.failure_30d
      acc.runs_30d += s.runs_30d
      return acc
    },
    { total_runs: 0, runs_30d: 0, success_30d: 0, failure_30d: 0 },
  )

  const successRate =
    aggregate.runs_30d > 0
      ? Math.round((aggregate.success_30d / aggregate.runs_30d) * 100)
      : null

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={<Activity className="w-3.5 h-3.5 text-white/60" />}
          label="Execuções (30d)"
          value={aggregate.runs_30d}
        />
        <StatTile
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          label="Sucesso (30d)"
          value={aggregate.success_30d}
          accent="emerald"
        />
        <StatTile
          icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          label="Falhas (30d)"
          value={aggregate.failure_30d}
          accent="amber"
        />
        <StatTile
          icon={<Clock className="w-3.5 h-3.5 text-white/60" />}
          label="Taxa de sucesso"
          value={successRate !== null ? `${successRate}%` : '—'}
        />
      </div>

      {recentData.length > 0 && (
        <div className="border border-white/10 bg-black/40">
          <header className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
              Últimas execuções
            </span>
          </header>
          <ul className="divide-y divide-white/5">
            {recentData.map((e) => (
              <RecentRow key={e.id} row={e} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent?: 'emerald' | 'amber'
}) {
  const color =
    accent === 'emerald'
      ? 'text-emerald-400'
      : accent === 'amber'
        ? 'text-amber-400'
        : 'text-white'

  return (
    <div className="border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/50">
          {label}
        </span>
      </div>
      <p className={`font-serif text-2xl ${color}`}>{value}</p>
    </div>
  )
}

function RecentRow({ row }: { row: WorkflowExecutionRow }) {
  const statusColor =
    row.status === 'success'
      ? 'text-emerald-400 border-emerald-500/30'
      : row.status === 'partial_failure'
        ? 'text-amber-400 border-amber-500/30'
        : 'text-white/60 border-white/10'

  const triggerType = (row.trigger_payload ?? {}) as Record<string, unknown>
  const relatedLabel =
    (triggerType.full_name as string) ||
    (triggerType.title as string) ||
    (triggerType.client_name as string) ||
    (triggerType.amount !== undefined ? `R$ ${triggerType.amount}` : null) ||
    null

  return (
    <li className="px-4 py-3 flex items-center gap-3 text-xs">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full border font-mono text-[9px] uppercase tracking-widest ${statusColor}`}
      >
        {row.status === 'success'
          ? 'ok'
          : row.status === 'partial_failure'
            ? 'falha'
            : row.status}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white truncate">
          {row.workflow_name ?? '(workflow removido)'}
        </p>
        {relatedLabel && (
          <p className="text-white/50 text-[11px] truncate">{relatedLabel}</p>
        )}
      </div>
      <span className="shrink-0 font-mono text-[10px] text-white/40">
        {formatDistanceToNow(new Date(row.started_at), {
          locale: ptBR,
          addSuffix: true,
        })}
      </span>
    </li>
  )
}
