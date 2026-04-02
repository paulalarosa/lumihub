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
import { Download, Trash2, Shield, FileText, AlertTriangle } from 'lucide-react'
import { useLGPD } from '@/hooks/useLGPD'

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
    isConsentGranted,
  } = useLGPD()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleToggleConsent = (type: string, granted: boolean) => {
    updateConsent.mutate({ consentType: type, granted })
  }

  const handleRequestDeletion = () => {
    requestDeletion.mutate()
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
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
            LGPD // Lei Geral de Proteção de Dados
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

            <Button
              variant="outline"
              className="rounded-none flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 font-mono text-xs uppercase tracking-widest"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Solicitar Exclusão
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground font-mono">
            A exportação gera um arquivo JSON com todos os seus dados. A
            exclusão é processada em até 15 dias úteis.
          </p>
        </CardContent>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-background border-border rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Solicitar Exclusão de Dados
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Ao confirmar, uma solicitação será enviada para nossa equipe. Seus
              dados pessoais serão anonimizados em até 15 dias úteis.
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/20 space-y-2">
              <p className="text-xs text-destructive font-medium">
                Esta ação é irreversível. Serão removidos:
              </p>
              <p className="text-[11px] text-destructive/80">
                Nome, email, telefone, endereço, CPF, data de nascimento, fotos
                e dados de clientes vinculados à sua conta.
              </p>
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
              {requestDeletion.isPending ? 'Enviando...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
