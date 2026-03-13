import { Link } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import { Button } from '@/components/ui/Button'
import {
  Users,
  Calendar,
  DollarSign,
  FolderOpen,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { AssistantsPanelCard } from '@/features/dashboard/components/AssistantsPanelCard'
import { motion } from 'framer-motion'
import { format } from 'date-fns/format'
import { ptBR } from 'date-fns/locale/pt-BR'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { useDashboard } from '../hooks/useDashboard'
import { SetupChecklist } from '@/components/onboarding/SetupChecklist'
import { PageLoader } from '@/components/ui/LoadingStates'

export default function Dashboard() {
  const { t } = useLanguage()
  const d = useDashboard()

  if (d.orgLoading || d.dataLoading) {
    return <PageLoader />
  }

  if (!d.user)
    return (
      <div className="p-8 text-center text-white">Carregando sessão...</div>
    )

  const stats = [
    ...(d.isOwner
      ? [
          {
            label: t('dashboard.stats.revenue'),
            value: `R$ ${d.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            description: `${t('dashboard.stats.commissions')}: R$ ${d.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            ctaLabel: t('dashboard.actions.details'),
            ctaLink: '/admin',
          },
        ]
      : []),
    {
      label: t('dashboard.stats.clients'),
      value: d.clientsCount.toString(),
      icon: Users,
      ctaLabel: t('dashboard.actions.add_client'),
      ctaLink: '/clientes',
    },
    {
      label: t('dashboard.stats.projects'),
      value: d.projectsCount.toString(),
      icon: FolderOpen,
      ctaLabel: t('dashboard.actions.create_project'),
      ctaLink: '/projetos',
    },
  ]

  return (
    <div className="min-h-screen bg-[#000000] text-white overflow-hidden selection:bg-white selection:text-black">
      <div className="fixed inset-0 z-0 pointer-events-none bg-noise opacity-50" />

      <main className="relative z-10 px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="h-[1px] w-12 bg-white/20" />
            <span className="font-mono uppercase tracking-[0.3em] text-gray-500 text-xs">
              {t('dashboard.control_center')}
            </span>
          </div>
          <h1 className="font-serif text-5xl tracking-tight text-white mb-4">
            {d.profileName ||
              d.user.email?.split('@')[0] ||
              d.user.user_metadata?.full_name?.split(' ')[0] ||
              'Maquiadora'}
          </h1>
        </motion.div>

        <SetupChecklist />

        <div className="mb-12 p-6 border border-white/10 bg-white/5 rounded-none">
          <span className="font-mono text-xs text-white/50 tracking-widest uppercase">
            STATUS:
          </span>
          <p className="text-xl font-serif text-white mt-1">
            AGUARDANDO CRONOGRAMA
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 auto-rows-[minmax(180px,auto)]">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="col-span-1 md:col-span-2 lg:col-span-2 lumi-card p-6 border border-white/20 relative overflow-hidden group hover:bg-white hover:text-black transition-colors duration-300 rounded-none"
            >
              <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <stat.icon className="w-6 h-6 text-white group-hover:text-black" />
              </div>
              <div className="mt-8">
                <h3 className="font-mono text-3xl md:text-4xl text-white group-hover:text-black font-light tracking-tighter">
                  {stat.value}
                </h3>
                <p className="text-xs text-white/40 group-hover:text-black/60 uppercase tracking-widest mt-2">
                  {stat.label}
                </p>
              </div>
              {'description' in stat && stat.description && (
                <div className="mt-4 pt-4 border-t border-white/10 group-hover:border-black/10">
                  <p className="font-mono text-xs text-white/60 group-hover:text-black/60">
                    {stat.description}
                  </p>
                </div>
              )}
              <Link to={stat.ctaLink} className="absolute bottom-6 right-6">
                <Button className="bg-white text-black rounded-none hover:bg-gray-200 text-xs uppercase tracking-widest px-4 h-8 group-hover:bg-black group-hover:text-white transition-colors">
                  {stat.ctaLabel}
                </Button>
              </Link>
            </motion.div>
          ))}

          {d.marketingTriggers.length > 0 && (
            <div className="col-span-1 md:col-span-4 lg:col-span-6 lumi-card p-6 border border-white/20 rounded-none">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-4 h-4 text-white" />
                <h3 className="text-sm font-medium text-white uppercase tracking-wider">
                  {t('dashboard.sections.insights')}
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {d.marketingTriggers.map((trigger, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 min-w-[200px] p-4 border border-white/10 hover:border-white transition-colors"
                  >
                    <p className="text-white text-sm font-medium">
                      {trigger.clientName}
                    </p>
                    <p className="text-xs text-white/50">{trigger.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 lumi-card p-6 border border-white/20 rounded-none h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white tracking-wide">
                {t('dashboard.sections.agenda')}
              </h3>
              <Link
                to="/calendar"
                className="text-xs font-mono text-white/60 hover:text-white uppercase border-b border-transparent hover:border-white transition-all"
              >
                {t('dashboard.view_all')}
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin max-h-[400px]">
              {d.upcomingEvents.length > 0 ? (
                d.upcomingEvents.map((event, i: number) => {
                  const title = event.title

                  let dateObj: Date
                  if (event.date.includes('T')) {
                    dateObj = new Date(event.date)
                  } else {
                    const timePart = event.time ? event.time : '00:00'
                    dateObj = new Date(`${event.date}T${timePart}`)
                  }

                  const isValidDate = !isNaN(dateObj.getTime())
                  const day = isValidDate ? dateObj.getDate() : '--'
                  const month = isValidDate
                    ? format(dateObj, 'MMM', { locale: ptBR })
                    : ''
                  const time = event.time || ''

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 border border-white/10 hover:border-white transition-colors group"
                    >
                      <div className="text-center w-12 pt-1 border-r border-white/10 group-hover:border-white/20 pr-4">
                        <span className="block text-[10px] text-white/40 group-hover:text-white/60 uppercase">
                          {month}
                        </span>
                        <span className="block text-xl font-mono text-white group-hover:text-white">
                          {day}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm text-white font-medium truncate group-hover:underline decoration-1 underline-offset-4">
                          {title}
                        </h4>
                        <p className="text-xs text-white/40 font-mono mt-0.5">
                          {time}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/30">
                  <Calendar className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">{t('dashboard.no_events')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 lumi-card p-6 border border-white/20 rounded-none h-full">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-4 h-4 text-white" />
              <h3 className="text-sm font-medium text-white uppercase tracking-wider">
                {t('dashboard.sections.team')}
              </h3>
            </div>
            <AssistantsPanelCard />
          </div>
        </div>

        <div className="col-span-1 md:col-span-4 lg:col-span-6 lumi-card p-6 border border-white/20 rounded-none mt-6">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <h3 className="text-sm font-medium text-white uppercase tracking-wider">
              {t('dashboard.sections.origin')}
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={d.originStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {d.originStats.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ['#FFFFFF', '#333333', '#666666', '#999999', '#CCCCCC'][
                          index % 5
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000',
                    border: '1px solid #333',
                  }}
                  itemStyle={{
                    color: '#fff',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                  }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  )
}
