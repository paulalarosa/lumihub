import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Download,
  Trash2,
  Shield,
  FileText,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLGPD } from '@/hooks/useLGPD'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CONSENT_ITEMS = [
  {
    type: 'terms_of_service',
    label: 'Termos de Serviço',
    description: 'Aceite dos termos e condições de uso da plataforma.',
    required: true,
  },
  {
    type: 'privacy_policy',
    label: 'Política de Privacidade',
    description:
      'Aceite da política de privacidade e tratamento de dados pessoais.',
    required: true,
  },
  {
    type: 'marketing_emails',
    label: 'Emails de Marketing',
    description: 'Receber novidades, promoções e conteúdo educativo por email.',
    required: false,
  },
  {
    type: 'analytics_tracking',
    label: 'Analytics e Rastreamento',
    description: 'Permitir coleta de dados de uso para melhoria da plataforma.',
    required: false,
  },
]

export default function PrivacySettings() {
  const {
    isLoading,
    updateConsent,
    exportData,
    requestDeletion,
    cancelDeletion,
    isConsentGranted,
  } = useLGPD()

  const { user } = useAuth()
  const queryClient = useQueryClient()

  const pendingDeletion = useQuery({
    queryKey: ['my-deletion-request', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('data_deletion_requests')
        .select('id, status, scheduled_for, requested_at')
        .eq('user_id', user!.id)
        .in('status', ['pending', 'scheduled'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    },
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteReason, setDeleteReason] = useState('')

  const handleToggleConsent = (type: string, granted: boolean) => {
    updateConsent.mutate({ consentType: type, granted })
  }

  const handleRequestDeletion = async () => {
    await requestDeletion.mutateAsync({ reason: deleteReason.trim() || undefined })
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
    setDeleteReason('')
    queryClient.invalidateQueries({ queryKey: ['my-deletion-request'] })
  }

  const handleCancelDeletion = async () => {
    await cancelDeletion.mutateAsync()
    queryClient.invalidateQueries({ queryKey: ['my-deletion-request'] })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-muted rounded-none" />
        <div className="h-32 bg-muted rounded-none" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-background border border-border rounded-none shadow-none">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-foreground" />
            <CardTitle className="font-serif text-lg">
              Privacidade e Consentimentos
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
            LGPD
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {CONSENT_ITEMS.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between px-6 py-4 border-b border-border/50 last:border-0"
            >
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground font-medium uppercase">
                    {item.label}
                  </span>
                  {item.required && (
                    <span className="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5">
                      OBRIGATÓRIO
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {item.description}
                </p>
              </div>
              <Switch
                checked={isConsentGranted(item.type)}
                onCheckedChange={(checked) =>
                  handleToggleConsent(item.type, checked)
                }
                disabled={item.required || updateConsent.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-background border border-border rounded-none shadow-none">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-foreground" />
            <CardTitle className="font-serif text-lg">
              Seus Direitos (LGPD)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você
            tem direito a acessar, corrigir, exportar e solicitar a exclusão dos
            seus dados pessoais.
          </p>

          {pendingDeletion.data && (
            <div className="p-4 border border-amber-500/30 bg-amber-500/5 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-amber-400 font-bold">
                    Exclusão agendada
                  </p>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Sua conta será excluída{' '}
                    {pendingDeletion.data.scheduled_for
                      ? formatDistanceToNow(
                          new Date(pendingDeletion.data.scheduled_for),
                          { locale: ptBR, addSuffix: true },
                        )
                      : 'em breve'}
                    . Você pode cancelar até lá.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleCancelDeletion}
                disabled={cancelDeletion.isPending}
                className="rounded-none w-full font-mono text-[10px] uppercase tracking-widest border-amber-500/30 hover:bg-amber-500/10"
              >
                <X className="h-3 w-3 mr-2" />
                {cancelDeletion.isPending ? 'Cancelando...' : 'Cancelar exclusão'}
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="rounded-none flex-1 font-mono text-xs uppercase tracking-widest"
              onClick={() => exportData.mutate()}
              disabled={exportData.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              {exportData.isPending
                ? 'Gerando arquivo...'
                : 'Exportar Meus Dados'}
            </Button>

            {!pendingDeletion.data && (
              <Button
                variant="outline"
                className="rounded-none flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 font-mono text-xs uppercase tracking-widest"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Solicitar Exclusão
              </Button>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground font-mono">
            Exportação gera JSON com todos os dados. Exclusão é agendada com
            carência de 7 dias — você pode cancelar nesse período.
          </p>
        </CardContent>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-background border-border rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Solicitar Exclusão de Dados
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              A exclusão será <strong>agendada para daqui 7 dias</strong>.
              Durante esse período você pode cancelar. Passado o prazo, todos
              os seus dados são apagados automaticamente.
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/20 space-y-2">
              <p className="text-xs text-destructive font-medium">
                Após os 7 dias, serão removidos definitivamente:
              </p>
              <p className="text-[11px] text-destructive/80">
                Conta, perfil, clientes, projetos, eventos, contratos,
                faturas, automações e qualquer dado vinculado ao seu user_id.
              </p>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
                Motivo (opcional — ajuda a gente a melhorar)
              </label>
              <textarea
                className="w-full px-3 py-2 bg-background border border-border text-foreground font-mono text-xs focus:outline-none focus:border-foreground resize-none"
                rows={2}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Ex: migrei pra outra ferramenta, não estou usando, etc."
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
                Digite EXCLUIR para confirmar
              </label>
              <input
                className="w-full px-3 py-2 bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:border-foreground"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="EXCLUIR"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-none font-mono text-xs uppercase tracking-widest"
              onClick={() => {
                setShowDeleteConfirm(false)
                setDeleteConfirmText('')
                setDeleteReason('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="rounded-none font-mono text-xs uppercase tracking-widest"
              onClick={handleRequestDeletion}
              disabled={
                deleteConfirmText !== 'EXCLUIR' || requestDeletion.isPending
              }
            >
              {requestDeletion.isPending ? 'Agendando...' : 'Agendar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
