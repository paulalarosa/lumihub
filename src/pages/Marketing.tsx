import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Send,
  History,
} from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import confetti from 'canvas-confetti'
import {
  useMarketing,
  useInactiveClients,
  useContactLog,
  useLogContact,
  type InactiveClient,
  type InactivityBucket,
} from '@/hooks/useMarketing'
import { MarketingCampaign } from '@/services/marketing'
import { useLanguage } from '@/hooks/useLanguage'

const DEFAULT_SCRIPTS: MarketingCampaign[] = [
  {
    id: 'casual',
    user_id: 'system',
    title: 'Saudades',
    content:
      'Oi {name}! O Studio está com saudades. Faz {days} dias que não te vejo — vamos renovar o visual essa semana?',
    category: 'casual',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'promo',
    user_id: 'system',
    title: 'Promoção VIP',
    content:
      'Olá {name}, liberei um horário VIP pra você com condição especial esta semana. O que acha de agendar?',
    category: 'promo',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'news',
    user_id: 'system',
    title: 'Novidades',
    content:
      'Oie {name}, tudo bem? Chegaram novidades incríveis aqui no Studio e lembrei de você. Quer dar uma olhadinha?',
    category: 'news',
    created_at: '',
    updated_at: '',
  },
]

const dateFormat = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const BUCKETS: { value: InactivityBucket; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: '45-60', label: '45 a 60 dias' },
  { value: '60-90', label: '60 a 90 dias' },
  { value: '90+', label: '90+ dias' },
]

export default function Marketing() {
  const { t } = useLanguage()
  const [bucket, setBucket] = useState<InactivityBucket>('all')
  const [selectedClient, setSelectedClient] = useState<InactiveClient | null>(null)
  const [selectedScriptId, setSelectedScriptId] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { campaigns, loading: campaignsLoading } = useMarketing()
  const { clients, loading: clientLoading, refetch } = useInactiveClients(bucket)
  const { data: log = [] } = useContactLog()
  const logContact = useLogContact()

  const displayCampaigns = campaigns.length > 0 ? campaigns : DEFAULT_SCRIPTS

  useEffect(() => {
    if (displayCampaigns.length > 0 && !selectedScriptId) {
      setSelectedScriptId(displayCampaigns[0].id)
    }
  }, [displayCampaigns, selectedScriptId])

  const handleOpenDialog = (client: InactiveClient) => {
    setSelectedClient(client)
    if (displayCampaigns.length > 0) {
      setSelectedScriptId(displayCampaigns[0].id)
    }
    setIsDialogOpen(true)
  }

  const handleSend = async () => {
    if (!selectedClient || !selectedClient.phone) return

    const script = displayCampaigns.find((s) => s.id === selectedScriptId)
    if (!script) return

    const message = script.content
      .replace('{name}', selectedClient.name.split(' ')[0])
      .replace('{days}', selectedClient.days_since_created.toString())

    await logContact.mutateAsync({
      client_id: selectedClient.id,
      template_id: script.id,
      template_title: script.title,
      message_preview: message.slice(0, 240),
      channel: 'whatsapp',
    })

    const encoded = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}?text=${encoded}`

    toast.success('Abrindo WhatsApp…')
    confetti({
      particleCount: 120,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#c0c0c0'],
    })

    window.open(whatsappUrl, '_blank')
    setIsDialogOpen(false)
  }

  const selectedScriptContent = displayCampaigns.find(
    (s) => s.id === selectedScriptId,
  )?.content

  return (
    <div className="min-h-screen bg-black p-6 md:p-10 space-y-10">
      <header className="flex flex-col gap-3 pb-6 border-b border-white/5">
        <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
          Reativação
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-white tracking-wide">
          {t('pages.marketing.title')}
        </h1>
        <p className="text-white/40 text-sm max-w-2xl">
          Reaproxime clientes que não agendam há mais de 45 dias. Identifica
          inatividade, sugere roteiros e não reenvia para quem já foi contatado
          nos últimos 14 dias.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
        <StatTile
          value={clients.length}
          label="Oportunidades"
          hint="Inativos no filtro"
        />
        <StatTile value={log.length} label="Contatos recentes" hint="Últimos 30" />
        <StatTile
          value={clients.filter((c) => c.days_since_created >= 90).length}
          label="Alta urgência"
          hint="90+ dias inativos"
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
              Lista de reativação
            </span>
            <div className="h-px w-16 bg-white/10" />
          </div>

          <div className="flex items-center gap-3">
            <Select value={bucket} onValueChange={(v) => setBucket(v as InactivityBucket)}>
              <SelectTrigger className="bg-black border-white/10 text-white rounded-none font-mono text-[10px] uppercase tracking-widest h-10 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border border-white/10 text-white rounded-none">
                {BUCKETS.map((b) => (
                  <SelectItem
                    key={b.value}
                    value={b.value}
                    className="font-mono text-[10px] uppercase tracking-widest focus:bg-white focus:text-black"
                  >
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={clientLoading}
              className="rounded-none border-white/10 hover:bg-white/5 h-10"
            >
              <RefreshCw
                className={`w-3 h-3 mr-2 ${clientLoading ? 'animate-spin' : ''}`}
              />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="border border-white/10 bg-white/[0.02]">
          {clientLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-none" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <CheckCircle2 className="w-6 h-6 text-white/20 mx-auto" />
              <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                Nenhuma cliente para reativar
              </p>
              <p className="text-white/30 text-sm">
                Toda sua base está ativa ou já foi contatada recentemente.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {clients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onContact={handleOpenDialog}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {log.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-white/40" />
            <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
              Histórico de envios
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="border border-white/10 bg-white/[0.02] divide-y divide-white/5">
            {log.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-6 py-4 gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm truncate">{entry.client_name}</p>
                  <p className="text-white/30 text-xs mt-1 truncate">
                    {entry.template_title ?? '—'}
                    {entry.message_preview && ` · ${entry.message_preview}`}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-white/40 tracking-widest uppercase whitespace-nowrap">
                  {dateFormat(entry.contacted_at)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-black border border-white/10 sm:max-w-md rounded-none text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl tracking-wide">
              Confirmar envio
            </DialogTitle>
            <DialogDescription className="text-white/50 text-sm">
              Para{' '}
              <span className="text-white font-medium">{selectedClient?.name}</span>
              {selectedClient?.days_since_created && (
                <> · {selectedClient.days_since_created} dias sem voltar</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-white/40 tracking-widest uppercase">
                Roteiro
              </label>
              {campaignsLoading ? (
                <Skeleton className="h-10 w-full bg-white/5 rounded-none" />
              ) : (
                <Select
                  value={selectedScriptId}
                  onValueChange={setSelectedScriptId}
                >
                  <SelectTrigger className="bg-black border-white/10 text-white rounded-none h-10 focus:ring-0 focus:border-white/30">
                    <SelectValue placeholder="Selecione um roteiro" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-white/10 text-white rounded-none">
                    {displayCampaigns.map((script) => (
                      <SelectItem
                        key={script.id}
                        value={script.id}
                        className="focus:bg-white focus:text-black"
                      >
                        {script.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="border border-white/10 p-4 bg-white/[0.03]">
              <p className="font-mono text-[9px] text-white/40 tracking-widest uppercase mb-2">
                Preview
              </p>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedScriptContent
                  ?.replace('{name}', selectedClient?.name.split(' ')[0] ?? '')
                  .replace('{days}', selectedClient?.days_since_created.toString() ?? '0')}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-none border-white/10"
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSend}>
              <Send className="w-3.5 h-3.5 mr-2" />
              Enviar WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatTile({
  value,
  label,
  hint,
}: {
  value: number
  label: string
  hint: string
}) {
  return (
    <div className="bg-black p-6 space-y-4">
      <p className="font-mono text-[10px] text-white/40 tracking-widest uppercase">
        {label}
      </p>
      <p className="font-serif text-4xl text-white leading-none">{value}</p>
      <p className="font-mono text-[9px] text-white/30 tracking-wider uppercase">
        {hint}
      </p>
    </div>
  )
}

function ClientRow({
  client,
  onContact,
}: {
  client: InactiveClient
  onContact: (c: InactiveClient) => void
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="h-10 w-10 border border-white/20 flex items-center justify-center text-white font-serif text-lg bg-black flex-shrink-0">
          {(client.name ?? '—').substring(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm truncate">{client.name}</p>
          <div className="flex items-center gap-3 text-white/40 text-xs mt-1 font-mono uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {client.days_since_created} dias inativo
            </span>
            {!client.phone && (
              <span className="text-red-400/60">Sem telefone</span>
            )}
          </div>
        </div>
      </div>
      <Button
        onClick={() => onContact(client)}
        disabled={!client.phone}
        className="rounded-none"
        variant="primary"
        size="sm"
      >
        <MessageCircle className="w-3.5 h-3.5 mr-2" />
        Enviar
      </Button>
    </div>
  )
}
