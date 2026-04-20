import {
  DollarSign,
  TrendingUp,
  Users,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  useAdminMRR,
  type SignupCohort,
} from '../hooks/useAdminMRR'

const currencyBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

export function AdminMRRPanel() {
  const { stats, cohorts } = useAdminMRR()

  const isLoading = stats.isLoading || cohorts.isLoading

  return (
    <section className="space-y-6">
      <header>
        <h2 className="font-serif text-2xl text-foreground">
          Receita recorrente
        </h2>
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
          MRR, ARR e coortes de signup (últimos 24 meses)
        </p>
      </header>

      {isLoading && (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {stats.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={<DollarSign className="w-3.5 h-3.5 text-emerald-500" />}
            label="MRR"
            value={currencyBRL(Number(stats.data.mrr))}
            accent="emerald"
          />
          <KpiCard
            icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
            label="ARR"
            value={currencyBRL(Number(stats.data.arr))}
            accent="emerald"
          />
          <KpiCard
            icon={<Users className="w-3.5 h-3.5 text-white/60" />}
            label="Ativas"
            value={stats.data.paying}
            sublabel={`${stats.data.in_trial} em trial`}
          />
          <KpiCard
            icon={<DollarSign className="w-3.5 h-3.5 text-white/60" />}
            label="ARPU"
            value={currencyBRL(Number(stats.data.arpu))}
            sublabel="receita por conta"
          />
        </div>
      )}

      {cohorts.data && cohorts.data.length > 0 && (
        <Card className="bg-black/40 border-white/10 rounded-none">
          <CardHeader>
            <CardTitle className="text-base font-serif">
              Coortes de signup
            </CardTitle>
            <CardDescription className="text-[10px] font-mono uppercase tracking-widest">
              Quantas se mantêm ativas agora
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <Th>Mês</Th>
                    <Th align="right">Signups</Th>
                    <Th align="right">Pagantes agora</Th>
                    <Th align="right">Em trial</Th>
                    <Th align="right">Churned</Th>
                    <Th align="right">Retenção</Th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.data.map((c) => (
                    <CohortRow key={c.cohort_month} cohort={c} />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sublabel?: string
  accent?: 'emerald'
}) {
  const color = accent === 'emerald' ? 'text-emerald-400' : 'text-foreground'
  return (
    <div className="border border-white/10 bg-white/[0.02] p-4 rounded-none">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={`font-serif text-2xl ${color}`}>{value}</p>
      {sublabel && (
        <p className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-wider mt-1">
          {sublabel}
        </p>
      )}
    </div>
  )
}

function CohortRow({ cohort: c }: { cohort: SignupCohort }) {
  const retentionPct =
    c.signups > 0
      ? Math.round(((c.active_now + c.trialing_now) / c.signups) * 100)
      : 0
  const retentionColor =
    retentionPct >= 60
      ? 'text-emerald-400'
      : retentionPct >= 30
        ? 'text-amber-400'
        : 'text-red-400'

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
      <Td>{monthLabel(c.cohort_month)}</Td>
      <Td align="right">{c.signups}</Td>
      <Td align="right" className="text-emerald-400 font-mono">
        {c.paying_now}
      </Td>
      <Td align="right" className="text-white/60 font-mono">
        {c.trialing_now}
      </Td>
      <Td align="right" className="text-red-400 font-mono">
        {c.churned}
      </Td>
      <Td align="right" className={`font-mono ${retentionColor}`}>
        {retentionPct}%
      </Td>
    </tr>
  )
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={`py-3 px-4 text-${align} text-muted-foreground font-mono text-[10px] uppercase tracking-[0.3em] font-bold`}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}) {
  return (
    <td
      className={`py-3 px-4 text-${align} text-sm text-foreground/90 ${className}`}
    >
      {children}
    </td>
  )
}
