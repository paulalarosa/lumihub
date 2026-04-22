import { useState } from 'react'
import { Loader2, Users2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import { usePeerConnections } from '../hooks/usePeerConnections'
import { usePeerEventAssignments } from '../hooks/usePeerEventAssignments'
import { useAuth } from '@/hooks/useAuth'

interface InvitePeerToEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string | null
}

/**
 * Modal que o host abre dentro do evento pra convidar peers como reforço.
 * Exibe apenas peers com `peer_connections.status = 'accepted'` — quem
 * ainda não aceitou conexão não pode ser chamada.
 *
 * UX importante: a caixa de "notas" tem aviso explícito de não colocar
 * dados da noiva. É o único campo de texto livre que a peer vê do evento.
 */
export function InvitePeerToEventDialog({
  open,
  onOpenChange,
  eventId,
}: InvitePeerToEventDialogProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { acceptedConnections } = usePeerConnections()
  const { assignments, invite, cancel } = usePeerEventAssignments(eventId)

  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null)
  const [fee, setFee] = useState('')
  const [notes, setNotes] = useState('')

  // IDs de peers já convidados (qualquer status ≠ declined/cancelled)
  const alreadyInvited = new Set(
    assignments
      .filter((a) => ['invited', 'accepted', 'done'].includes(a.status))
      .map((a) => a.peer_user_id),
  )

  // Peers disponíveis pra convidar = conexões aceitas que ainda não foram
  // chamadas nesse evento
  const availablePeers = acceptedConnections
    .map((c) => {
      const isHostSide = c.host_user_id === user?.id
      const peer = isHostSide ? c.peer_profile : c.host_profile
      const peerId = isHostSide ? c.peer_user_id : c.host_user_id
      return {
        id: peerId,
        name: peer?.full_name || peer?.email || 'Sem nome',
        email: peer?.email ?? null,
      }
    })
    .filter((p) => !alreadyInvited.has(p.id))

  const resetForm = () => {
    setSelectedPeerId(null)
    setFee('')
    setNotes('')
  }

  const handleInvite = async () => {
    if (!selectedPeerId) return
    const feeNum = fee ? parseFloat(fee.replace(',', '.')) : 0
    try {
      await invite.mutateAsync({
        peerUserId: selectedPeerId,
        agreedFee: feeNum,
        notes: notes.trim() || undefined,
      })
      resetForm()
    } catch {
      // Toast tratado no hook.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) resetForm()
      }}
    >
      <DialogContent className="bg-black border border-white/15 rounded-none text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Users2 className="w-5 h-5 text-white/70" />
            {t('network.event_invite.dialog_title')}
          </DialogTitle>
          <DialogDescription className="text-white/50 text-sm">
            {t('network.event_invite.dialog_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-5">
          {/* Lista de convites existentes pra esse evento */}
          {assignments.length > 0 && (
            <section className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                {t('network.event_invite.already_invited')}
              </p>
              <ul className="space-y-1">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 p-2.5 border border-white/10 bg-white/[0.02]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">
                        {a.peer_profile?.full_name ||
                          a.peer_profile?.email ||
                          '—'}
                      </p>
                      <p className="text-[10px] text-white/30 font-mono uppercase">
                        {t(`network.event_invite.status.${a.status}`)} ·{' '}
                        R$ {a.agreed_fee.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    {['invited', 'accepted'].includes(a.status) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cancel.mutate(a.id)}
                        disabled={cancel.isPending}
                        className="h-8 w-8 p-0 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-none"
                        title={t('network.event_invite.cancel_invite')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Formulário de novo convite */}
          {availablePeers.length === 0 ? (
            <div className="border border-dashed border-white/15 p-6 text-center">
              <p className="text-sm text-white/50 mb-3">
                {t('network.event_invite.no_peers_available')}
              </p>
              <Link
                to="/rede"
                className="text-[10px] font-mono uppercase tracking-widest text-white/60 hover:text-white border-b border-white/20 hover:border-white pb-0.5"
              >
                {t('network.event_invite.go_to_network')}
              </Link>
            </div>
          ) : (
            <section className="space-y-3 border-t border-white/10 pt-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                {t('network.event_invite.new_invite')}
              </p>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-gray-400 font-mono">
                  {t('network.event_invite.peer_label')}
                </label>
                <select
                  value={selectedPeerId ?? ''}
                  onChange={(e) => setSelectedPeerId(e.target.value || null)}
                  className="w-full h-10 bg-black border border-white/30 text-white focus:border-white font-mono text-sm px-3 rounded-none"
                >
                  <option value="">
                    {t('network.event_invite.peer_placeholder')}
                  </option>
                  {availablePeers.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      className="bg-black text-white"
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-gray-400 font-mono">
                  {t('network.event_invite.fee_label')}
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="R$ 150,00"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none h-10 font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-widest text-gray-400 font-mono">
                  {t('network.event_invite.notes_label')}
                </label>
                <Textarea
                  rows={3}
                  placeholder={t('network.event_invite.notes_placeholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none font-mono text-sm resize-none"
                />
                <p className="text-[10px] text-amber-300/80 font-mono leading-relaxed">
                  {t('network.event_invite.notes_warning')}
                </p>
              </div>
            </section>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={invite.isPending}
            className="border-white/20 text-white hover:bg-white/5 rounded-none font-mono text-xs uppercase tracking-widest"
          >
            {t('network.event_invite.close')}
          </Button>
          {availablePeers.length > 0 && (
            <Button
              onClick={handleInvite}
              disabled={!selectedPeerId || invite.isPending}
              className="bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs uppercase tracking-widest"
            >
              {invite.isPending && (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              )}
              {t('network.event_invite.send')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
