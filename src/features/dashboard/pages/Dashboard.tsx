import { Link } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import {
  Users,
  Calendar,
  DollarSign,
  FolderOpen,
  ArrowUpRight,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { AssistantsPanelCard } from '@/features/dashboard/components/AssistantsPanelCard'
import { motion } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useDashboard } from '../hooks/useDashboard'
import { SetupChecklist } from '@/components/onboarding/SetupChecklist'
import { PageLoader } from '@/components/ui/PageLoader'

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div {...fadeUp} className="mb-10">
          <p className="text-xs font-mono text-white/40 uppercase tracking-[0.2em] mb-1">
            {t('dashboard.control_center')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-white">
            {displayName}
          </h1>
        </motion.div>

        <SetupChecklist />

        {nextEventValid && (
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="mb-8 flex items-center gap-3 px-4 py-3 border border-white/10 bg-white/[0.03]"
          >
            <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
            <p className="text-sm text-white/60">
              Próximo evento:{' '}
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

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {d.isOwner && (
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <MetricCard
                icon={DollarSign}
                label={t('dashboard.stats.revenue')}
                value={`R$ ${d.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                link="/dashboard/financial"
                linkLabel={t('dashboard.actions.details')}
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
                to="/calendar"
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
                  const dateObj = startTime ? new Date(startTime) : null
                  const isValid = dateObj && !isNaN(dateObj.getTime())

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 border border-white/[0.06] hover:border-white/20 transition-colors group"
                    >
                      <div className="text-center w-11 flex-shrink-0">
                        <span className="block text-[10px] text-white/30 uppercase leading-none">
                          {isValid
                            ? format(dateObj, 'MMM', { locale: ptBR })
                            : ''}
                        </span>
                        <span className="block text-lg font-mono text-white/90 leading-tight">
                          {isValid ? dateObj.getDate() : '--'}
                        </span>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-white/90 truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-white/30 font-mono">
                          {isValid
                            ? format(dateObj, 'HH:mm', { locale: ptBR })
                            : ''}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="h-48 flex flex-col items-center justify-center">
                  <Calendar className="w-8 h-8 text-white/10 mb-3" />
                  <p className="text-sm text-white/20">
                    {t('dashboard.no_events')}
                  </p>
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

          {d.originStats.length > 0 && (
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.35 }}
              className="lg:col-span-2 border border-white/10 bg-white/[0.02] p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-white/40" />
                <h2 className="text-sm font-medium text-white/80 uppercase tracking-wider">
                  {t('dashboard.sections.origin')}
                </h2>
              </div>
              <div className="h-[220px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={d.originStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {d.originStats.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#ffffff', '#555555'][index % 2]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111',
                        border: '1px solid #333',
                        borderRadius: '0',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#fff', textTransform: 'uppercase' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 ml-4">
                  {d.originStats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2"
                        style={{
                          backgroundColor: ['#ffffff', '#555555'][i % 2],
                        }}
                      />
                      <span className="text-xs text-white/50 uppercase tracking-wide">
                        {stat.name}: {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
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
}: {
  icon: React.ElementType
  label: string
  value: string
  link: string
  linkLabel: string
}) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-5 h-full flex flex-col justify-between group hover:border-white/25 transition-colors">
      <div className="flex items-start justify-between mb-6">
        <div className="p-2 border border-white/10 bg-white/[0.04]">
          <Icon className="w-4 h-4 text-white/50" />
        </div>
        <Link to={link}>
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider hover:text-white/60 transition-colors flex items-center gap-1">
            {linkLabel}
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-mono text-white tracking-tight font-light">
          {value}
        </p>
        <p className="text-[11px] text-white/35 uppercase tracking-widest mt-1">
          {label}
        </p>
      </div>
    </div>
  )
}
