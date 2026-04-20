import { UserX, AlertTriangle, Loader2, XCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useAdminDeletionRequests,
  type AdminDeletionRequest,
} from '../hooks/useAdminDeletionRequests'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusStyle: Record<string, string> = {
  pending: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
  scheduled: 'border-red-500/30 text-red-400 bg-red-500/5',
  executed: 'border-zinc-700 text-zinc-500',
  cancelled: 'border-emerald-500/30 text-emerald-500',
}

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  scheduled: 'Agendada',
  executed: 'Executada',
  cancelled: 'Cancelada',
}

export function AdminDeletionRequests() {
  const { list, cancelAsAdmin } = useAdminDeletionRequests()

  const pendingCount = (list.data ?? []).filter((r) =>
    ['pending', 'scheduled'].includes(r.status),
  ).length

  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-xl text-foreground flex items-center gap-2">
            <UserX className="w-4 h-4 text-muted-foreground" />
            Solicitações de exclusão
          </h2>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
            LGPD Art. 18 II · {pendingCount} pendente
            {pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {list.isLoading && (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {list.data && list.data.length === 0 && (
        <div className="py-8 text-center border border-dashed border-white/10 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Nenhuma solicitação registrada
        </div>
      )}

      {list.data && list.data.length > 0 && (
        <Card className="bg-black/40 border border-white/10 rounded-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <Th>Usuária</Th>
                    <Th>Motivo</Th>
                    <Th>Status</Th>
                    <Th>Solicitada</Th>
                    <Th>Agendada p/</Th>
                    <Th align="right">Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((r) => (
                    <Row
                      key={r.id}
                      row={r}
                      onCancel={() => cancelAsAdmin.mutate(r.id)}
                      isCancelling={cancelAsAdmin.isPending}
                    />
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

function Row({
  row: r,
  onCancel,
  isCancelling,
}: {
  row: AdminDeletionRequest
  onCancel: () => void
  isCancelling: boolean
}) {
  const active = ['pending', 'scheduled'].includes(r.status)
  const isUrgent =
    r.scheduled_for &&
    new Date(r.scheduled_for).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
      <Td>
        <div className="font-mono text-[11px] text-foreground">
          {r.user_email ?? '—'}
        </div>
        <div className="font-mono text-[9px] text-muted-foreground/60">
          {r.user_id.slice(0, 8)}
        </div>
      </Td>
      <Td>
        {r.reason ? (
          <span className="text-[11px] text-foreground/70 line-clamp-2 max-w-xs">
            {r.reason}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/40 italic">—</span>
        )}
      </Td>
      <Td>
        <Badge
          variant="outline"
          className={`rounded-none font-mono text-[9px] uppercase tracking-widest ${statusStyle[r.status] ?? ''}`}
        >
          {isUrgent && r.status === 'scheduled' && (
            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
          )}
          {statusLabel[r.status] ?? r.status}
        </Badge>
      </Td>
      <Td>
        <div className="text-[11px] font-mono text-muted-foreground">
          {formatDistanceToNow(new Date(r.requested_at), {
            locale: ptBR,
            addSuffix: true,
          })}
        </div>
      </Td>
      <Td>
        {r.scheduled_for ? (
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <Clock className="w-3 h-3 text-muted-foreground" />
            {format(new Date(r.scheduled_for), 'dd/MM HH:mm', { locale: ptBR })}
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/40">—</span>
        )}
      </Td>
      <Td align="right">
        {active && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isCancelling}
            className="rounded-none border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-black font-mono text-[9px] uppercase tracking-widest h-7"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Cancelar
          </Button>
        )}
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
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <td className={`py-3 px-4 text-${align} align-top`}>{children}</td>
  )
}
