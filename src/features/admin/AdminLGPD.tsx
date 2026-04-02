import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/services/logger'
import {
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface LGPDRequest {
  id: string
  user_id: string
  user_email: string | null
  user_name: string | null
  request_type: string
  status: string
  requested_at: string
  completed_at: string | null
  notes: string | null
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'border-yellow-500/50 text-yellow-500',
  processing: 'border-blue-500/50 text-blue-500',
  completed: 'border-green-500/50 text-green-500',
  rejected: 'border-destructive text-destructive',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  rejected: 'Rejeitado',
}

export default function AdminLGPD() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [confirmAction, setConfirmAction] = useState<{
    request: LGPDRequest
    action: 'approve' | 'reject'
  } | null>(null)

  const requestsQuery = useQuery({
    queryKey: ['admin-lgpd-requests'],
    queryFn: async (): Promise<LGPDRequest[]> => {
      const { data, error } = await supabase.rpc('get_lgpd_requests')
      if (error) throw error
      return (data as LGPDRequest[]) || []
    },
  })

  const processMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string
      action: string
    }) => {
      const { data, error } = await supabase.rpc('admin_process_deletion', {
        p_request_id: requestId,
        p_action: action,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      toast({
        title:
          variables.action === 'approve'
            ? 'Dados excluídos'
            : 'Solicitação rejeitada',
        description:
          variables.action === 'approve'
            ? 'Os dados pessoais foram anonimizados.'
            : 'A solicitação foi marcada como rejeitada.',
      })
      queryClient.invalidateQueries({ queryKey: ['admin-lgpd-requests'] })
      setConfirmAction(null)
    },
    onError: (error) => {
      logger.error('AdminLGPD.process', error)
      toast({
        title: 'Erro',
        description: 'Falha ao processar solicitação.',
        variant: 'destructive',
      })
    },
  })

  const requests = requestsQuery.data || []
  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-foreground font-serif text-2xl tracking-tight">
            LGPD — Solicitações
          </h2>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-1">
            Lei Geral de Proteção de Dados // Compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Badge
              variant="outline"
              className="rounded-none border-yellow-500/50 text-yellow-500 font-mono text-xs"
            >
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestsQuery.refetch()}
            className="rounded-none"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      <Card className="bg-background border border-border rounded-none shadow-none">
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground font-mono text-xs uppercase">
                Nenhuma solicitação LGPD
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-6 text-muted-foreground font-mono text-[10px] uppercase tracking-widest font-normal">
                      Usuário
                    </th>
                    <th className="text-left py-3 px-6 text-muted-foreground font-mono text-[10px] uppercase tracking-widest font-normal">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-6 text-muted-foreground font-mono text-[10px] uppercase tracking-widest font-normal">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-muted-foreground font-mono text-[10px] uppercase tracking-widest font-normal">
                      Data
                    </th>
                    <th className="text-right py-3 px-6 text-muted-foreground font-mono text-[10px] uppercase tracking-widest font-normal">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-serif text-foreground text-sm">
                            {r.user_name || 'Sem nome'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {r.user_email || r.user_id.slice(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs text-foreground/70 uppercase">
                          {r.request_type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          variant="outline"
                          className={`rounded-none font-mono text-[10px] uppercase ${STATUS_STYLES[r.status] || ''}`}
                        >
                          {STATUS_LABELS[r.status] || r.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground text-xs font-mono">
                        {new Date(r.requested_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {r.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-none h-7 text-[10px] font-mono uppercase text-green-600 border-green-500/30"
                              onClick={() =>
                                setConfirmAction({
                                  request: r,
                                  action: 'approve',
                                })
                              }
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-none h-7 text-[10px] font-mono uppercase text-destructive"
                              onClick={() =>
                                setConfirmAction({
                                  request: r,
                                  action: 'reject',
                                })
                              }
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                        {r.status === 'completed' && (
                          <span className="font-mono text-[10px] text-green-500">
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            {r.completed_at
                              ? new Date(r.completed_at).toLocaleDateString(
                                  'pt-BR',
                                )
                              : ''}
                          </span>
                        )}
                        {r.status === 'rejected' && (
                          <span className="font-mono text-[10px] text-destructive">
                            <XCircle className="h-3 w-3 inline mr-1" />
                            REJEITADO
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent className="bg-background border-border rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              {confirmAction?.action === 'approve' ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              {confirmAction?.action === 'approve'
                ? 'Confirmar Exclusão de Dados'
                : 'Rejeitar Solicitação'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground font-mono">
              Usuário:{' '}
              <strong className="text-foreground">
                {confirmAction?.request.user_name ||
                  confirmAction?.request.user_email}
              </strong>
            </p>
            {confirmAction?.action === 'approve' && (
              <p className="text-xs text-destructive mt-3 p-2 bg-destructive/10 border border-destructive/20 font-mono">
                Todos os dados pessoais serão permanentemente anonimizados. Esta
                ação não pode ser desfeita.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-none font-mono text-xs uppercase tracking-widest"
              onClick={() => setConfirmAction(null)}
            >
              Cancelar
            </Button>
            <Button
              variant={
                confirmAction?.action === 'approve' ? 'destructive' : 'primary'
              }
              className="rounded-none font-mono text-xs uppercase tracking-widest"
              onClick={() => {
                if (!confirmAction) return
                processMutation.mutate({
                  requestId: confirmAction.request.id,
                  action: confirmAction.action,
                })
              }}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending
                ? 'Processando...'
                : confirmAction?.action === 'approve'
                  ? 'Excluir Dados'
                  : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
