import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  User,
  Calendar,
  Settings,
  Eye,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react'
import { GenerateContractButton } from '@/features/projects/components/GenerateContractButton'
import { format } from 'date-fns/format'

interface ProjectHeaderProps {
  project: {
    id: string
    name: string
    clients?: { name: string; phone?: string } | null
    event_date: string | null
    event_location?: string | null
  }
  viewMode: 'internal' | 'preview'
  setViewMode: (mode: 'internal' | 'preview') => void
  copyPortalLink: () => void
  copied: boolean
  handleSendReminder: () => void
  t: (key: string) => string
}

export const ProjectHeader = ({
  project,
  viewMode,
  setViewMode,
  copyPortalLink,
  copied,
  handleSendReminder,
  t,
}: ProjectHeaderProps) => {
  return (
    <header className="border-b border-white/20 bg-black">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/projetos">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-none text-white hover:bg-white hover:text-black transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif font-bold text-2xl text-white uppercase tracking-tighter">
                {project.name}
              </h1>
              <div className="flex items-center gap-4 text-xs font-mono text-white/60 mt-1 uppercase tracking-widest">
                {project.clients && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {project.clients.name}
                  </span>
                )}
                {project.event_date && (
                  <span className="flex items-center gap-1 border-l border-white/20 pl-4">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(project.event_date), 'dd/MM/yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'internal' && (
              <GenerateContractButton projectId={project.id} />
            )}
            {}
            <div className="flex items-center border border-white/20 bg-black">
              <Button
                variant={viewMode === 'internal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('internal')}
                className={`rounded-none gap-2 font-mono uppercase text-xs tracking-wider ${viewMode === 'internal' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
              >
                <Settings className="h-3 w-3" />
                {t('dashboard.internal')}
              </Button>
              <div className="w-[1px] h-4 bg-white/20"></div>
              <Button
                variant={viewMode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className={`rounded-none gap-2 font-mono uppercase text-xs tracking-wider ${viewMode === 'preview' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
              >
                <Eye className="h-3 w-3" />
                {t('dashboard.preview')}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={copyPortalLink}
              className="gap-2 rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'COPIED' : 'PORTAL_LINK'}
            </Button>

            <Button
              onClick={handleSendReminder}
              className="gap-2 rounded-none bg-[#25D366] text-white hover:bg-[#128C7E] border-none font-mono text-xs uppercase tracking-widest"
            >
              <MessageCircle className="h-4 w-4" />
              Lembrete_24h
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
