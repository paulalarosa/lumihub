import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '@/components/seo/SEOHead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ArrowLeft,
  Loader2,
  Plus,
  UserCheck,
  UserX,
  Trash2,
  Mail,
  Users2,
} from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { useAuth } from '@/hooks/useAuth'
import { usePeerConnections, PeerConnection } from '../hooks/usePeerConnections'
import { usePeerHistory } from '../hooks/usePeerHistory'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { ptBR } from 'date-fns/locale/pt-BR'

export default function NetworkPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const {
    acceptedConnections,
    receivedPending,
    sentPending,
    isLoading,
    invite,
    respond,
    remove,
  } = usePeerConnections()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleInvite = async () => {
    try {
      await invite.mutateAsync({
        email,
        message: message.trim() || undefined,
      })
      setDialogOpen(false)
      setEmail('')
      setMessage('')
    } catch {
      // Toast já é disparado pelo hook.
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <SEOHead title={t('network.title')} noindex />

      <header className="border-b border-white/20 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
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
                    {t('network.title')}
                  </h1>
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono">
                    {t('network.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/meus-reforcos">
                <Button
                  variant="outline"
                  className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest h-10 px-4"
                >
                  {t('peer_events.title')}
                </Button>
              </Link>
              <Button
                onClick={() => setDialogOpen(true)}
                className="rounded-none bg-white text-black hover:bg-gray-200 font-mono text-xs uppercase tracking-widest h-10 px-6 gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('network.invite.button')}
              </Button>
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
          <Tabs defaultValue="connections" className="space-y-6">
            <TabsList className="bg-transparent border border-white/10 rounded-none p-0 h-auto w-full flex overflow-x-auto">
              <TabsTrigger
                value="connections"
                className="rounded-none flex-1 min-w-[120px] h-10 text-[10px] font-mono uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black"
              >
                {t('network.tabs.connections')} ({acceptedConnections.length})
              </TabsTrigger>
              <TabsTrigger
                value="received"
                className="rounded-none flex-1 min-w-[140px] h-10 text-[10px] font-mono uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black"
              >
                {t('network.tabs.received')} ({receivedPending.length})
              </TabsTrigger>
              <TabsTrigger
                value="sent"
                className="rounded-none flex-1 min-w-[140px] h-10 text-[10px] font-mono uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black"
              >
                {t('network.tabs.sent')} ({sentPending.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="connections">
              {acceptedConnections.length === 0 ? (
                <EmptyPanel
                  title={t('network.empty.connections_title')}
                  description={t('network.empty.connections_description')}
                />
              ) : (
                <div className="space-y-2">
                  {acceptedConnections.map((conn) => (
                    <ConnectionRow
                      key={conn.id}
                      connection={conn}
                      selfId={user?.id ?? null}
                      onRemove={() => remove.mutate(conn.id)}
                      removing={remove.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="received">
              {receivedPending.length === 0 ? (
                <EmptyPanel
                  title={t('network.empty.received_title')}
                  description={t('network.empty.received_description')}
                />
              ) : (
                <div className="space-y-2">
                  {receivedPending.map((conn) => (
                    <PendingReceivedRow
                      key={conn.id}
                      connection={conn}
                      onAccept={() =>
                        respond.mutate({
                          connectionId: conn.id,
                          accept: true,
                        })
                      }
                      onDecline={() =>
                        respond.mutate({
                          connectionId: conn.id,
                          accept: false,
                        })
                      }
                      responding={respond.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent">
              {sentPending.length === 0 ? (
                <EmptyPanel
                  title={t('network.empty.sent_title')}
                  description={t('network.empty.sent_description')}
                />
              ) : (
                <div className="space-y-2">
                  {sentPending.map((conn) => (
                    <PendingSentRow
                      key={conn.id}
                      connection={conn}
                      onCancel={() => remove.mutate(conn.id)}
                      cancelling={remove.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-black border border-white/15 rounded-none text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {t('network.invite.dialog_title')}
            </DialogTitle>
            <DialogDescription className="text-white/50 text-sm">
              {t('network.invite.dialog_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-[10px] uppercase tracking-widest text-gray-400 font-mono">
                {t('network.invite.email_label')}
              </label>
              <Input
                type="email"
                placeholder={t('network.invite.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none h-10 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-[10px] uppercase tracking-widest text-gray-400 font-mono">
                {t('network.invite.message_label')}
              </label>
              <Textarea
                placeholder={t('network.invite.message_placeholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none font-mono text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={invite.isPending}
              className="border-white/20 text-white hover:bg-white/5 rounded-none font-mono text-xs uppercase tracking-widest"
            >
              {t('network.invite.cancel')}
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!email || invite.isPending}
              className="bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs uppercase tracking-widest"
            >
              {invite.isPending && (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              )}
              {t('network.invite.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      <Mail className="w-10 h-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-white font-serif text-lg uppercase tracking-wider mb-2">
        {title}
      </h3>
      <p className="text-white/40 text-sm">{description}</p>
    </div>
  )
}

function ConnectionRow({
  connection,
  selfId,
  onRemove,
  removing,
}: {
  connection: PeerConnection
  selfId: string | null
  onRemove: () => void
  removing: boolean
}) {
  const { t } = useLanguage()
  // Mostra o "outro lado" — se eu sou host, mostro o peer, e vice-versa.
  const other =
    connection.host_user_id === selfId
      ? connection.peer_profile
      : connection.host_profile
  const otherId =
    connection.host_user_id === selfId
      ? connection.peer_user_id
      : connection.host_user_id
  const { data: history } = usePeerHistory(otherId)

  // Badge compacto só se houver histórico — evita poluir conexões novas.
  const totalEvents =
    (history?.events_done ?? 0) + (history?.events_upcoming ?? 0)

  return (
    <div className="flex items-center justify-between gap-4 p-4 border border-white/10 hover:border-white/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 bg-white/[0.06] border border-white/10 flex items-center justify-center text-xs font-mono text-white/70 flex-shrink-0">
          {(other?.full_name ?? other?.email ?? '?')
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-white truncate">
            {other?.full_name || other?.email || 'Sem nome'}
          </p>
          <p className="text-[10px] text-white/30 font-mono truncate">
            {totalEvents > 0
              ? `${totalEvents} ${totalEvents === 1 ? 'evento' : 'eventos'} · ${other?.email ?? ''}`
              : other?.email}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        disabled={removing}
        onClick={onRemove}
        className="text-white/30 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 rounded-none"
        aria-label={t('network.actions.remove')}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function PendingReceivedRow({
  connection,
  onAccept,
  onDecline,
  responding,
}: {
  connection: PeerConnection
  onAccept: () => void
  onDecline: () => void
  responding: boolean
}) {
  const { t } = useLanguage()
  const host = connection.host_profile

  return (
    <div className="p-4 border border-white/10 hover:border-white/30 transition-colors space-y-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 bg-white/[0.06] border border-white/10 flex items-center justify-center text-xs font-mono text-white/70 flex-shrink-0">
          {(host?.full_name ?? host?.email ?? '?')
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white truncate">
            {host?.full_name || host?.email || 'Sem nome'}
          </p>
          <p className="text-[10px] text-white/30 font-mono">
            {formatDistanceToNow(new Date(connection.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
      </div>
      {connection.message && (
        <p className="text-sm text-white/60 border-l-2 border-white/20 pl-3 py-1 italic">
          “{connection.message}”
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={responding}
          onClick={onDecline}
          className="rounded-none border-white/20 text-white/60 hover:bg-white/5 font-mono text-[10px] uppercase tracking-widest h-9"
        >
          <UserX className="h-3 w-3 mr-2" />
          {t('network.actions.decline')}
        </Button>
        <Button
          size="sm"
          disabled={responding}
          onClick={onAccept}
          className="rounded-none bg-white text-black hover:bg-gray-200 font-mono text-[10px] uppercase tracking-widest h-9"
        >
          <UserCheck className="h-3 w-3 mr-2" />
          {t('network.actions.accept')}
        </Button>
      </div>
    </div>
  )
}

function PendingSentRow({
  connection,
  onCancel,
  cancelling,
}: {
  connection: PeerConnection
  onCancel: () => void
  cancelling: boolean
}) {
  const { t } = useLanguage()
  const peer = connection.peer_profile

  return (
    <div className="flex items-center justify-between gap-4 p-4 border border-white/10">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 bg-white/[0.02] border border-white/10 flex items-center justify-center text-xs font-mono text-white/40 flex-shrink-0">
          {(peer?.full_name ?? peer?.email ?? '?')
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-white/80 truncate">
            {peer?.full_name || peer?.email || connection.invited_email}
          </p>
          <p className="text-[10px] text-white/30 font-mono">
            {t('network.status.pending')} ·{' '}
            {formatDistanceToNow(new Date(connection.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={cancelling}
        onClick={onCancel}
        className="text-white/40 hover:text-red-400 hover:bg-red-500/10 font-mono text-[10px] uppercase tracking-widest h-9 rounded-none"
      >
        {t('network.actions.cancel_invite')}
      </Button>
    </div>
  )
}
