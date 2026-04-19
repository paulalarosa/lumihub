import SEOHead from '@/components/seo/SEOHead'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  FolderOpen,
  ArrowLeft,
  Calendar,
  MapPin,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useProjectsPage, StatusFilter } from '../hooks/useProjectsPage'
import { PageLoader } from '@/components/ui/PageLoader'
import { LoadingSpinner } from '@/components/ui/PageLoader'
import { NewProjectWizard } from '../components/NewProjectWizard'
import { cn } from '@/lib/utils'

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'completed', label: 'Concluídos' },
  { key: 'archived', label: 'Arquivados' },
]

function getDaysLabel(eventDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(eventDate + 'T12:00:00')
  if (isNaN(date.getTime())) return null
  const diff = differenceInDays(date, today)
  if (diff < 0) return { label: `Há ${Math.abs(diff)}d`, past: true }
  if (diff === 0) return { label: 'Hoje', past: false }
  if (diff === 1) return { label: 'Amanhã', past: false }
  return { label: `Em ${diff}d`, past: false }
}

export default function ProjectsPage() {
  const p = useProjectsPage()

  if (p.loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black">
      <SEOHead title="Projetos" noindex />

      <header className="border-b border-white/20 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white hover:text-black rounded-none"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-white/20 flex items-center justify-center group hover:bg-white hover:text-black transition-all">
                  <FolderOpen className="h-5 w-5 text-white group-hover:text-black" />
                </div>
                <div>
                  <h1 className="font-serif font-bold text-2xl uppercase tracking-tighter leading-none">
                    Projetos
                  </h1>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] mt-0.5">
                    Gestão de eventos
                  </p>
                </div>
              </div>
            </div>

            <NewProjectWizard preselectedClientId={p.preselectedClientId} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px border border-white/10 bg-white/10">
          {[
            { label: 'Total', value: p.stats.total, icon: FolderOpen },
            { label: 'Ativos', value: p.stats.active, icon: TrendingUp },
            { label: 'Concluídos', value: p.stats.completed, icon: FolderOpen },
            { label: 'Este Mês', value: p.stats.thisMonth, icon: Calendar },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-black px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3 h-3 text-white/30" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                  {label}
                </span>
              </div>
              <p className="font-serif text-3xl text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">

          <div className="flex items-center gap-0 border border-white/10">
            {STATUS_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => p.setStatusFilter(key)}
                className={cn(
                  'px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all',
                  p.statusFilter === key
                    ? 'bg-white text-black'
                    : 'text-white/40 hover:text-white hover:bg-white/5',
                )}
              >
                {label}
                {key !== 'all' && (
                  <span className={cn(
                    'ml-1.5 text-[8px]',
                    p.statusFilter === key ? 'text-black/50' : 'text-white/20',
                  )}>
                    {key === 'active' ? p.stats.active
                      : key === 'completed' ? p.stats.completed
                      : p.projects.filter(pr => pr.status === 'archived').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
            <Input
              placeholder="Buscar projetos..."
              className="pl-10 bg-black border-white/20 rounded-none text-white font-mono text-sm focus:border-white placeholder:text-white/20"
              value={p.searchTerm}
              onChange={(e) => p.setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {p.loadingData ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : p.filteredProjects.length === 0 ? (
          <div className="border border-white/10 border-dashed py-16 text-center">
            <FolderOpen className="h-10 w-10 text-white/15 mx-auto mb-4" />
            <h3 className="font-serif text-lg text-white/40 uppercase tracking-wide mb-2">
              {p.searchTerm || p.statusFilter !== 'all' ? 'Nenhum resultado' : 'Sem projetos'}
            </h3>
            <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-6">
              {p.searchTerm ? 'Tente outros termos de busca' : 'Crie seu primeiro projeto para começar'}
            </p>
            {!p.searchTerm && p.statusFilter === 'all' && (
              <NewProjectWizard
                trigger={
                  <Button className="bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs uppercase tracking-widest">
                    Criar Projeto
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <div className="border border-white/10">

            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 border-b border-white/10 bg-white/[0.02]">
              <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">Projeto / Cliente</span>
              <span className="font-mono text-[8px] uppercase tracking-widest text-white/30 text-right w-28">Tipo</span>
              <span className="font-mono text-[8px] uppercase tracking-widest text-white/30 text-right w-32">Data</span>
              <span className="font-mono text-[8px] uppercase tracking-widest text-white/30 text-right w-20">Status</span>
            </div>

            {p.filteredProjects.map((project, i) => {
              const days = project.event_date ? getDaysLabel(project.event_date) : null

              return (
                <Link
                  key={project.id}
                  to={`/projetos/${project.id}`}
                  className={cn(
                    'flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto] gap-3 md:gap-4 px-5 py-4 border-b border-white/10 hover:bg-white hover:text-black transition-all duration-150 group',
                    i === p.filteredProjects.length - 1 && 'border-b-0',
                  )}
                >

                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                      project.status === 'active' ? 'bg-white group-hover:bg-black' : 'bg-white/20 group-hover:bg-black/30',
                    )} />
                    <div className="min-w-0">
                      <p className="font-serif text-sm uppercase tracking-wide truncate text-white group-hover:text-black">
                        {project.name}
                      </p>
                      {project.client && (
                        <p className="font-mono text-[9px] text-white/40 group-hover:text-black/50 truncate mt-0.5">
                          {project.client.full_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center md:justify-end md:w-28">
                    {project.event_type ? (
                      <span className="border border-white/20 group-hover:border-black/20 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-white/50 group-hover:text-black/50">
                        {project.event_type}
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] text-white/20 group-hover:text-black/20">—</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 md:justify-end md:w-32">
                    {project.event_date ? (
                      (() => {
                        const d = new Date(project.event_date + 'T12:00:00')
                        const isValid = !isNaN(d.getTime())
                        return isValid ? (
                          <>
                            <Calendar className="w-3 h-3 text-white/30 group-hover:text-black/40 flex-shrink-0 hidden md:block" />
                            <div className="text-right">
                              <p className="font-mono text-[10px] text-white/60 group-hover:text-black/60">
                                {format(d, 'dd MMM yyyy', { locale: ptBR })}
                              </p>
                              {days && (
                                <p className={cn(
                                  'font-mono text-[8px] uppercase tracking-widest',
                                  days.past
                                    ? 'text-white/25 group-hover:text-black/30'
                                    : 'text-white/50 group-hover:text-black/50',
                                )}>
                                  {days.label}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="font-mono text-[9px] text-white/20 group-hover:text-black/20 md:ml-auto">—</span>
                        )
                      })()
                    ) : (
                      <span className="font-mono text-[9px] text-white/20 group-hover:text-black/20 md:ml-auto">—</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end md:w-20 gap-3">
                    <span className={cn(
                      'border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest',
                      project.status === 'active'
                        ? 'border-white/50 text-white/70 group-hover:border-black/40 group-hover:text-black/60'
                        : project.status === 'completed'
                        ? 'border-white/20 text-white/30 group-hover:border-black/20 group-hover:text-black/30'
                        : 'border-white/10 text-white/20 group-hover:border-black/10 group-hover:text-black/20',
                    )}>
                      {project.status === 'active' ? 'Ativo'
                        : project.status === 'completed' ? 'Concluído'
                        : 'Arquivado'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-black/40 flex-shrink-0" />
                  </div>

                  {project.event_location && (
                    <div className="flex items-center gap-1.5 md:hidden col-span-full">
                      <MapPin className="w-3 h-3 text-white/25 group-hover:text-black/30" />
                      <span className="font-mono text-[9px] text-white/30 group-hover:text-black/30 truncate">
                        {project.event_location}
                      </span>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
