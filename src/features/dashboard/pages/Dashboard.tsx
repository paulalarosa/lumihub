import { Link } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import {
  Users,
  Calendar,
  DollarSign,
  FolderOpen,
  ArrowUpRight,
  Clock,
  FileSignature,
  AlertTriangle,
} from 'lucide-react'
import { AssistantsPanelCard } from '@/features/dashboard/components/AssistantsPanelCard'
import { motion } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useDashboard } from '../hooks/useDashboard'
import { OnboardingChecklist } from '@/features/onboarding/components/OnboardingChecklist'
import { PageLoader } from '@/components/ui/page-loader'

const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: n >= 10000 ? 0 : 2,
  })

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const { t } = useLanguage()
  const d = useDashboard()

  if (d.orgLoading || d.dataLoading) {
    return <PageLoader />
  }

  if (!d.user) {
    return <PageLoader message="Carregando sessão..." />
  }

  const displayName =
    d.profileName ||
    d.user.user_metadata?.full_name?.split(' ')[0] ||
    d.user.email?.split('@')[0] ||
    'Olá'

  const nextEvent = d.upcomingEvents[0]
  const nextEventDate = nextEvent?.event_date
    ? new Date(nextEvent.event_date)
    : null
  const nextEventValid = nextEventDate && !isNaN(nextEventDate.getTime())

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-white selection:text-black">
      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}
      >
        <motion.div {...fadeUp} className="mb-10">
          <p className="text-xs font-mono text-white/40 uppercase tracking-[0.2em] mb-1">
            {t('dashboard.control_center')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-white">
            {displayName}
          </h1>
        </motion.div>

        <OnboardingChecklist />

        {nextEventValid && (
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="mb-8 flex items-center gap-3 px-4 py-3 border border-white/10 bg-white/[0.03]"
          >
            <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
            <p className="text-sm text-white/60">
              {t('dashboard.next_event_prefix')}:{' '}
              <span className="text-white font-medium">{nextEvent.title}</span>
              {' — '}
              <span className="text-white/80">
                {formatDistanceToNow(nextEventDate, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </p>
          </motion.div>
        )}

        {(d.overdueCount > 0 || d.contractsPending > 0) && (
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="mb-6 border border-amber-500/30 bg-amber-500/[0.05] p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="flex-1 text-sm text-amber-100/90 space-y-0.5">
              {d.overdueCount > 0 && (
                <p>
                  <span className="font-medium text-white">
                    {t(
                      d.overdueCount === 1
                        ? 'dashboard.alerts.invoices_overdue_one'
                        : 'dashboard.alerts.invoices_overdue_other',
                      { count: d.overdueCount },
                    )}
                  </span>{' '}
                  — {t('dashboard.alerts.pending_total')}{' '}
                  <span className="font-mono">{fmtBRL(d.pendingAmount)}</span>.
                </p>
              )}
              {d.contractsPending > 0 && (
                <p>
                  <span className="font-medium text-white">
                    {t(
                      d.contractsPending === 1
                        ? 'dashboard.alerts.contracts_pending_one'
                        : 'dashboard.alerts.contracts_pending_other',
                      { count: d.contractsPending },
                    )}
                  </span>{' '}
                  {t('dashboard.alerts.waiting_bride')}.
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {d.overdueCount > 0 && (
                <Link
                  to="/dashboard/financial"
                  className="text-[10px] font-mono uppercase tracking-widest text-amber-200 hover:text-white border border-amber-500/30 hover:border-white px-3 py-1.5 transition-colors"
                >
                  {t('dashboard.alerts.view_invoices')}
                </Link>
              )}
              {d.contractsPending > 0 && (
                <Link
                  to="/contratos"
                  className="text-[10px] font-mono uppercase tracking-widest text-amber-200 hover:text-white border border-amber-500/30 hover:border-white px-3 py-1.5 transition-colors"
                >
                  {t('dashboard.alerts.view_contracts')}
                </Link>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {d.isOwner && (
            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="col-span-2 lg:col-span-1">
              <RevenueCard
                mtd={d.revenueMTD}
                ytd={d.revenueYTD}
                pending={d.pendingAmount}
                avgTicket={
                  d.stats?.leadsConversion?.converted
                    ? d.totalRevenue / d.stats.leadsConversion.converted
                    : 0
                }
                labels={{
                  mtd: t('dashboard.stats.revenue_mtd'),
                  ytd: t('dashboard.stats.revenue_ytd'),
                  pending: t('dashboard.stats.revenue_pending'),
                  avgTicket: t('dashboard.stats.avg_ticket'),
                  details: t('dashboard.actions.details'),
                }}
              />
            </motion.div>
          )}

          <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
            <MetricCard
              icon={Users}
              label={t('dashboard.stats.clients')}
              value={d.clientsCount.toString()}
              link="/clientes"
              linkLabel={t('dashboard.actions.add_client')}
            />
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <MetricCard
              icon={FolderOpen}
              label={t('dashboard.stats.projects')}
              value={d.projectsCount.toString()}
              link="/projetos"
              linkLabel={t('dashboard.actions.create_project')}
            />
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
            <MetricCard
              icon={FileSignature}
              label={t('dashboard.stats.contracts_pending')}
              value={d.contractsPending.toString()}
              link="/contratos"
              linkLabel={t('dashboard.actions.open')}
              tone={d.contractsPending > 0 ? 'warn' : 'neutral'}
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.25 }}
            className="border border-white/10 bg-white/[0.02] p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-white/80 uppercase tracking-wider">
                {t('dashboard.sections.agenda')}
              </h2>
              <Link
                to="/calendar?view=agenda"
                className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1"
              >
                {t('dashboard.view_all')}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto max-h-[380px] scrollbar-thin">
              {d.upcomingEvents.length > 0 ? (
                d.upcomingEvents.map((event, i) => {
                  const startTime =
                    (event as { start_time?: string; event_date?: string })
                      .start_time || event.event_date
                  const eventDate = event.event_date
                    ? new Date(event.event_date)
                    : null
                  const timeObj = startTime ? new Date(startTime) : null
                  const isValid =
                    eventDate && !isNaN(eventDate.getTime())
                  const currentYear = new Date().getFullYear()
                  const eventYear = isValid ? eventDate.getFullYear() : null
                  const showYear = eventYear && eventYear !== currentYear
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 border border-white/[0.06] hover:border-white/20 transition-colors group"
                    >
                      <div className="text-center w-12 flex-shrink-0">
                        <span className="block text-[10px] text-white/30 uppercase leading-none">
                          {isValid
                            ? format(eventDate, 'MMM', { locale: ptBR })
                            : ''}
                        </span>
                        <span className="block text-lg font-mono text-white/90 leading-tight">
                          {isValid ? eventDate.getDate() : '--'}
                        </span>
                        {showYear && (
                          <span className="block text-[9px] font-mono text-white/40 leading-none mt-0.5">
                            {eventYear}
                          </span>
                        )}
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-white/90 truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-white/30 font-mono">
                          {timeObj && !isNaN(timeObj.getTime())
                            ? format(timeObj, 'HH:mm', { locale: ptBR })
                            : ''}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-center px-4">
                  <Calendar className="w-8 h-8 text-white/15" />
                  <p className="text-sm text-white/40">
                    {t('dashboard.no_events')}
                  </p>
                  <Link
                    to="/calendar"
                    className="text-[10px] font-mono uppercase tracking-widest text-white/60 hover:text-white border-b border-white/20 hover:border-white pb-0.5 transition-colors"
                  >
                    Criar primeiro evento
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ delay: 0.3 }}
            className="border border-white/10 bg-white/[0.02] p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-white/80 uppercase tracking-wider">
                {t('dashboard.sections.team')}
              </h2>
              <Link
                to="/assistentes"
                className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1"
              >
                {t('dashboard.view_all')}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <AssistantsPanelCard />
          </motion.div>

        </div>
      </main>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  link,
  linkLabel,
  tone = 'neutral',
}: {
  icon: React.ElementType
  label: string
  value: string
  link: string
  linkLabel: string
  tone?: 'neutral' | 'warn'
}) {
  const isWarn = tone === 'warn'
  return (
    <div
      className={`border bg-white/[0.02] p-5 h-full flex flex-col justify-between group transition-colors ${
        isWarn
          ? 'border-amber-500/40 hover:border-amber-400'
          : 'border-white/10 hover:border-white/25'
      }`}
    >
      <div className="flex items-start justify-between mb-6">
        <div
          className={`p-2 border ${
            isWarn
              ? 'border-amber-500/40 bg-amber-500/[0.08]'
              : 'border-white/10 bg-white/[0.04]'
          }`}
        >
          <Icon
            className={`w-4 h-4 ${isWarn ? 'text-amber-300' : 'text-white/50'}`}
          />
        </div>
        <Link to={link}>
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider hover:text-white/60 transition-colors flex items-center gap-1">
            {linkLabel}
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
      <div>
        <p
          className={`text-2xl sm:text-3xl font-mono tracking-tight font-light ${
            isWarn ? 'text-amber-100' : 'text-white'
          }`}
        >
          {value}
        </p>
        <p className="text-[11px] text-white/35 uppercase tracking-widest mt-1">
          {label}
        </p>
      </div>
    </div>
  )
}

function RevenueCard({
  mtd,
  ytd,
  pending,
  avgTicket,
  labels,
}: {
  mtd: number
  ytd: number
  pending: number
  avgTicket: number
  labels: {
    mtd: string
    ytd: string
    pending: string
    avgTicket: string
    details: string
  }
}) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-5 h-full flex flex-col justify-between group hover:border-white/25 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 border border-white/10 bg-white/[0.04]">
          <DollarSign className="w-4 h-4 text-white/50" />
        </div>
        <Link to="/dashboard/financial">
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider hover:text-white/60 transition-colors flex items-center gap-1">
            {labels.details}
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
      <div className="space-y-1">
        <p className="text-2xl sm:text-3xl font-mono text-white tracking-tight font-light">
          {fmtBRL(mtd)}
        </p>
        <p className="text-[11px] text-white/35 uppercase tracking-widest">
          {labels.mtd}
        </p>
        <div className="pt-3 mt-3 border-t border-white/[0.06] grid grid-cols-3 gap-2">
          <div className="min-w-0">
            <p className="text-[9px] text-white/30 uppercase tracking-wider truncate">
              {labels.ytd}
            </p>
            <p className="text-xs font-mono text-white/70 truncate">
              {fmtBRL(ytd)}
            </p>
          </div>
          <div className="min-w-0 text-center">
            <p className="text-[9px] text-white/30 uppercase tracking-wider truncate">
              {labels.pending}
            </p>
            <p className="text-xs font-mono text-white/70 truncate">
              {fmtBRL(pending)}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[9px] text-white/30 uppercase tracking-wider truncate">
              {labels.avgTicket}
            </p>
            <p className="text-xs font-mono text-white/70 truncate">
              {fmtBRL(avgTicket)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

