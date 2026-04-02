import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Megaphone,
  Plus,
  Send,
  Trash2,
  Users,
  Mail,
  Eye,
  MousePointer,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAdminMarketing,
  Campaign,
} from '@/features/admin/hooks/useAdminMarketing'

const SEGMENTS = [
  { value: 'all', label: 'Todos os usuários' },
  { value: 'active', label: 'Assinantes ativos' },
  { value: 'inactive', label: 'Usuários inativos' },
  { value: 'free', label: 'Plano gratuito' },
  { value: 'paid', label: 'Planos pagos' },
]

const STATUS_STYLES: Record<string, string> = {
  draft: 'border-white/20 text-zinc-500',
  scheduled: 'border-blue-500/50 text-blue-500',
  sending: 'border-yellow-500/50 text-yellow-500',
  sent: 'border-green-500/50 text-green-500',
  failed: 'border-red-500/50 text-red-500',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  sending: 'Enviando',
  sent: 'Enviada',
  failed: 'Falhou',
}

export default function AdminMarketing() {
  const {
    campaigns,
    isLoading,
    createCampaign,
    sendCampaign,
    deleteCampaign,
    refetch,
  } = useAdminMarketing()

  const [showCreate, setShowCreate] = useState(false)
  const [confirmSend, setConfirmSend] = useState<Campaign | null>(null)
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body_html: '',
    target_segment: 'all',
  })

  const handleCreate = () => {
    if (!form.name || !form.subject || !form.body_html) return

    createCampaign.mutate(
      {
        name: form.name,
        subject: form.subject,
        body_html: form.body_html,
        target_segment: form.target_segment,
      },
      {
        onSuccess: () => {
          setShowCreate(false)
          setForm({
            name: '',
            subject: '',
            body_html: '',
            target_segment: 'all',
          })
        },
      },
    )
  }

  const handleSend = () => {
    if (!confirmSend) return
    sendCampaign.mutate(confirmSend.id, {
      onSuccess: () => setConfirmSend(null),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-24 bg-zinc-900/50 rounded-none border border-white/5"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-white font-serif text-2xl tracking-tight">
            Campanhas de Email
          </h2>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em] mt-1">
            Marketing Automation
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-none border-white/10 bg-black hover:bg-white/5 font-mono text-[10px] uppercase tracking-wider"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Sincronizar
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreate(true)}
            className="rounded-none bg-white text-black hover:bg-zinc-200 font-mono text-[10px] uppercase tracking-wider font-bold"
          >
            <Plus className="h-3 w-3 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Mail, label: 'Total Campanhas', val: campaigns.length },
          {
            icon: Send,
            label: 'Enviadas',
            val: campaigns.filter((c) => c.status === 'sent').length,
          },
          {
            icon: Eye,
            label: 'Total Aberturas',
            val: campaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0),
          },
          {
            icon: MousePointer,
            label: 'Total Cliques',
            val: campaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0),
          },
        ].map((s, i) => (
          <Card
            key={i}
            className="bg-black border border-white/10 rounded-none relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/[0.02] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <CardContent className="p-4 flex items-center gap-4 relative z-10">
              <div className="h-10 w-10 flex items-center justify-center border border-white/5 bg-zinc-900/50">
                <s.icon className="h-5 w-5 text-zinc-500" />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-500 mb-0.5">
                  {s.label}
                </p>
                <p className="text-xl font-serif text-white tracking-tight">
                  {s.val}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {}
      <Card className="bg-black border border-white/10 rounded-none overflow-hidden">
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-white/5 m-4">
              <Megaphone className="h-10 w-10 mx-auto mb-4 text-zinc-800" />
              <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.2em]">
                Nenhuma campanha ativa no sistema
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreate(true)}
                className="mt-6 rounded-none border-white/10 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white"
              >
                Inaugurar Módulo
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-zinc-900/30">
                    <th className="text-left py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.15em] font-bold">
                      Identificação / Assunto
                    </th>
                    <th className="text-left py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.15em] font-bold">
                      Target_Segment
                    </th>
                    <th className="text-left py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.15em] font-bold">
                      Lifecycle_Status
                    </th>
                    <th className="text-center py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.15em] font-bold">
                      Recipients
                    </th>
                    <th className="text-right py-4 px-6 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.15em] font-bold">
                      Ações_Administrativas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-serif text-white text-sm tracking-wide">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[280px] uppercase tracking-tighter">
                            SUB:{' '}
                            {confirmSend?.id === c.id
                              ? 'PENDENTE_CONFIRMACAO'
                              : c.subject}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-zinc-600" />
                          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                            {SEGMENTS.find((s) => s.value === c.target_segment)
                              ?.label || c.target_segment}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <Badge
                          variant="outline"
                          className={`rounded-none font-mono text-[9px] px-2 py-0.5 uppercase tracking-[0.15em] border-opacity-30 ${STATUS_STYLES[c.status] || ''}`}
                        >
                          {STATUS_LABELS[c.status] || c.status}
                        </Badge>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-mono text-xs text-white">
                            {c.total_sent || 0} / {c.total_recipients}
                          </span>
                          <div className="w-16 h-1 bg-zinc-900 mt-1 overflow-hidden">
                            <div
                              className="h-full bg-white/20 transition-all duration-1000"
                              style={{
                                width: `${(c.total_sent / (c.total_recipients || 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {c.status === 'draft' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none h-8 px-3 border-white/10 bg-black text-white hover:bg-white hover:text-black font-mono text-[9px] uppercase tracking-widest transition-all"
                                onClick={() => setConfirmSend(c)}
                              >
                                <Send className="h-3 w-3 mr-2" />
                                Transmitir
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-none h-8 w-8 p-0 text-zinc-600 hover:text-red-500 hover:bg-red-500/10"
                                onClick={() => deleteCampaign.mutate(c.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {c.status === 'sent' && (
                            <div className="flex flex-col items-end opacity-40">
                              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest leading-none">
                                Sent_On
                              </span>
                              <span className="font-mono text-[10px] text-zinc-300">
                                {c.sent_at
                                  ? new Date(c.sent_at).toLocaleDateString(
                                      'pt-BR',
                                    )
                                  : '---'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-black border-white/10 rounded-none max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-white tracking-tight">
              Configurar Nova Campanha
            </DialogTitle>
            <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-[0.2em] mt-1">
              Command Center
            </p>
          </DialogHeader>
          <div className="space-y-5 py-6">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold block">
                Internal_Name
              </label>
              <Input
                className="rounded-none border-white/10 bg-zinc-950 text-white font-mono text-xs placeholder:text-zinc-800 focus:border-white/30 transition-all"
                placeholder="PROMO_AUTUMN_2026"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold block">
                  Broadcast_Subject
                </label>
                <Input
                  className="rounded-none border-white/10 bg-zinc-950 text-white font-mono text-xs placeholder:text-zinc-800 transition-all"
                  placeholder="Seu convite exclusivo..."
                  value={form.subject}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, subject: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold block">
                  Target_Segment
                </label>
                <Select
                  value={form.target_segment}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, target_segment: v }))
                  }
                >
                  <SelectTrigger className="rounded-none border-white/10 bg-zinc-950 text-white font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-white/10 bg-zinc-950 text-white font-mono text-xs">
                    {SEGMENTS.map((s) => (
                      <SelectItem
                        key={s.value}
                        value={s.value}
                        className="focus:bg-white/5 focus:text-white rounded-none"
                      >
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold block flex justify-between">
                <span>Payload_Body (HTML)</span>
                <span className="text-zinc-700">SES_ENABLED</span>
              </label>
              <Textarea
                className="rounded-none border-white/10 bg-zinc-950 text-zinc-300 font-mono text-xs min-h-[180px] custom-scrollbar focus:border-white/30 resize-none transition-all placeholder:text-zinc-800"
                placeholder="<html><body><h1>Olá {{nome}}</h1>...</body></html>"
                value={form.body_html}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, body_html: e.target.value }))
                }
              />
              <div className="mt-2 flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border border-zinc-800 flex items-center justify-center">
                  <span className="text-[8px] text-zinc-600">i</span>
                </div>
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                  Use {'{{nome}}'} para injeção dinâmica de metadados do perfil.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-white/5 pt-4">
            <Button
              variant="ghost"
              className="rounded-none font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5"
              onClick={() => setShowCreate(false)}
            >
              Abort_Operation
            </Button>
            <Button
              className="rounded-none bg-white text-black hover:bg-zinc-200 font-mono text-[10px] uppercase tracking-widest font-bold px-8"
              onClick={handleCreate}
              disabled={
                !form.name ||
                !form.subject ||
                !form.body_html ||
                createCampaign.isPending
              }
            >
              {createCampaign.isPending ? 'REGISTRANDO...' : 'EXECUTAR_COMMIT'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog
        open={!!confirmSend}
        onOpenChange={(open) => !open && setConfirmSend(null)}
      >
        <DialogContent className="bg-black border-red-500/20 rounded-none max-w-sm shadow-[0_0_80px_rgba(239,68,68,0.1)]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-red-500 tracking-tight flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              Confirmar Transmissão
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                ID_CAMPANHA
              </p>
              <p className="font-mono text-xs text-white uppercase">
                {confirmSend?.name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                MÉTRICA_RECIPIENTES
              </p>
              <div className="flex items-center gap-2 p-3 bg-zinc-900/50 border border-white/5">
                <Users className="h-4 w-4 text-zinc-500" />
                <span className="font-mono text-sm text-white font-bold tracking-tighter">
                  {confirmSend?.total_recipients} ENDEREÇOS_VÁLIDOS
                </span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono uppercase leading-relaxed tracking-wider">
              A TRANSMISSÃO SERÁ PROCESSADA PELO AWS_SES EM LOTE. ESTA AÇÃO NÃO
              PODE SER INTERROMPIDA APÓS O DISPARO DO TRIGGER.
            </p>
          </div>
          <DialogFooter className="bg-red-500/5 -mx-6 -mb-6 p-6 mt-2 border-t border-red-500/10">
            <Button
              variant="ghost"
              className="rounded-none font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white"
              onClick={() => setConfirmSend(null)}
            >
              MANTER_RASCUNHO
            </Button>
            <Button
              className="rounded-none bg-red-600 text-white hover:bg-red-500 font-mono text-[10px] uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              onClick={handleSend}
              disabled={sendCampaign.isPending}
            >
              {sendCampaign.isPending
                ? 'SINALIZANDO_AWS...'
                : 'TRIGGER_BROADCAST'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
