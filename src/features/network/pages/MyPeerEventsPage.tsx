import { Link } from 'react-router-dom'
import SEOHead from '@/components/seo/SEOHead'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  UserCheck,
  UserX,
  Loader2,
  Users2,
} from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import {
  useMyPeerAssignments,
  MyPeerAssignment,
} from '../hooks/useMyPeerAssignments'
import { format } from 'date-fns/format'
import { ptBR } from 'date-fns/locale/pt-BR'

export default function MyPeerEventsPage() {
  const { t } = useLanguage()
  const { pending, upcoming, history, isLoading, respond } =
    useMyPeerAssignments()

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <SEOHead title={t('peer_events.title')} noindex />

      <header className="border-b border-white/20 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/rede">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/10 text-white h-10 w-10 rounded-none"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white flex items-center justify-center">
                <Users2 className="h-5 w-5 text-black" />
              </div>
              <div>
                <h1 className="font-serif text-2xl text-white tracking-tight uppercase">
                  {t('peer_events.title')}
                </h1>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono">
                  {t('peer_events.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="h-6 w-6 text-white/30 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="bg-transparent border border-white/10 rounded-none p-0 h-auto w-full flex overflow-x-auto">
              <TabsTrigger
                value="pending"
                className="rounded-none flex-1 min-w-[140px] h-10 text-[10px] font-mono uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black"
              >
                {t('peer_events.tabs.pending')} ({pending.length})
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="rounded-none flex-1 min-w-[120px] h-10 text-[10px] font-mono uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black"
              >
                {t('peer_events.tabs.upcoming')} ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-none flex-1 min-w-[120px] h-10 text-[10px] font-mono uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black"
              >
                {t('peer_events.tabs.history')} ({history.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pending.length === 0 ? (
                <EmptyPanel
                  title={t('peer_events.empty.pending_title')}
                  description={t('peer_events.empty.pending_description')}
                />
              ) : (
                <div className="space-y-3">
                  {pending.map((a) => (
                    <PendingCard
                      key={a.id}
                      assignment={a}
                      onRespond={(accept) =>
                        respond.mutate({
                          assignmentId: a.id,
                          accept,
                        })
                      }
                      responding={respond.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming">
              {upcoming.length === 0 ? (
                <EmptyPanel
                  title={t('peer_events.empty.upcoming_title')}
                  description={t('peer_events.empty.upcoming_description')}
                />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((a) => (
                    <AssignmentCard key={a.id} assignment={a} compact={false} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {history.length === 0 ? (
                <EmptyPanel
                  title={t('peer_events.empty.history_title')}
                  description={t('peer_events.empty.history_description')}
                />
              ) : (
                <div className="space-y-3">
                  {history.map((a) => (
                    <AssignmentCard key={a.id} assignment={a} compact />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}

function EmptyPanel({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="border border-dashed border-white/20 p-10 text-center">
      <Calendar className="w-10 h-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-white font-serif text-lg uppercase tracking-wider mb-2">
        {title}
      </h3>
      <p className="text-white/40 text-sm">{description}</p>
    </div>
  )
}

function formatFee(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

function formatDateLine(dateStr: string) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return format(d, "EEE, d 'de' MMMM", { locale: ptBR })
  } catch {
    return dateStr
  }
}

function AssignmentCard({
  assignment: a,
  compact,
}: {
  assignment: MyPeerAssignment
  compact: boolean
}) {
  const { t } = useLanguage()
  const hostName =
    a.host_full_name || a.host_email || t('peer_events.card.host')

  return (
    <article
      className={`border border-white/10 bg-white/[0.02] p-5 ${
        compact ? 'opacity-70' : 'hover:border-white/30 transition-colors'
      }`}
    >
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-serif text-lg text-white truncate">
            {formatDateLine(a.event_date)}
          </p>
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
            {a.event_type || 'Evento'}
          </p>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 border border-white/10 px-2 py-1">
          {t(`network.event_invite.status.${a.status}`)}
        </span>
      </header>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {(a.start_time || a.end_time) && (
          <div className="flex items-center gap-2 text-white/70">
            <Clock className="w-4 h-4 text-white/30 flex-shrink-0" />
            <span className="font-mono">
              {a.start_time ?? '--'}
              {a.end_time ? ` – ${a.end_time}` : ''}
            </span>
          </div>
        )}
        {(a.location || a.address) && (
          <div className="flex items-center gap-2 text-white/70">
            <MapPin className="w-4 h-4 text-white/30 flex-shrink-0" />
            <span className="truncate">
              {[a.location, a.address].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-white/70">
          <DollarSign className="w-4 h-4 text-white/30 flex-shrink-0" />
          <span className="font-mono">{formatFee(a.agreed_fee)}</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <Users2 className="w-4 h-4 text-white/30 flex-shrink-0" />
          <span className="truncate">{hostName}</span>
        </div>
      </dl>

      {a.notes && (
        <p className="mt-4 text-sm text-white/60 italic border-l-2 border-white/15 pl-3 py-1">
          “{a.notes}”
        </p>
      )}
    </article>
  )
}

function PendingCard({
  assignment,
  onRespond,
  responding,
}: {
  assignment: MyPeerAssignment
  onRespond: (accept: boolean) => void
  responding: boolean
}) {
  const { t } = useLanguage()

  return (
    <div className="border border-amber-500/30 bg-amber-500/[0.03] p-5 space-y-4">
      <AssignmentCardInner assignment={assignment} />
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={responding}
          onClick={() => onRespond(false)}
          className="rounded-none border-white/20 text-white/60 hover:bg-white/5 font-mono text-[10px] uppercase tracking-widest h-9"
        >
          <UserX className="h-3 w-3 mr-2" />
          {t('peer_events.card.decline')}
        </Button>
        <Button
          size="sm"
          disabled={responding}
          onClick={() => onRespond(true)}
          className="rounded-none bg-white text-black hover:bg-gray-200 font-mono text-[10px] uppercase tracking-widest h-9"
        >
          <UserCheck className="h-3 w-3 mr-2" />
          {t('peer_events.card.accept')}
        </Button>
      </div>
    </div>
  )
}

/**
 * Versão sem borda, pra usar dentro do PendingCard (que já tem borda
 * própria colorida). Evita dupla margem.
 */
function AssignmentCardInner({ assignment: a }: { assignment: MyPeerAssignment }) {
  const { t } = useLanguage()
  const hostName =
    a.host_full_name || a.host_email || t('peer_events.card.host')

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-serif text-lg text-white truncate">
            {formatDateLine(a.event_date)}
          </p>
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
            {a.event_type || 'Evento'}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {(a.start_time || a.end_time) && (
          <div className="flex items-center gap-2 text-white/70">
            <Clock className="w-4 h-4 text-white/30 flex-shrink-0" />
            <span className="font-mono">
              {a.start_time ?? '--'}
              {a.end_time ? ` – ${a.end_time}` : ''}
            </span>
          </div>
        )}
        {(a.location || a.address) && (
          <div className="flex items-center gap-2 text-white/70">
            <MapPin className="w-4 h-4 text-white/30 flex-shrink-0" />
            <span className="truncate">
              {[a.location, a.address].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-white/70">
          <DollarSign className="w-4 h-4 text-white/30 flex-shrink-0" />
          <span className="font-mono">{formatFee(a.agreed_fee)}</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <Users2 className="w-4 h-4 text-white/30 flex-shrink-0" />
          <span className="truncate">{hostName}</span>
        </div>
      </dl>
      {a.notes && (
        <p className="mt-3 text-sm text-white/60 italic border-l-2 border-white/15 pl-3 py-1">
          “{a.notes}”
        </p>
      )}
    </div>
  )
}
