import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Users,
  UserCheck,
  FolderKanban,
  Receipt,
  ArrowUpRight,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Lock,
  Download,
} from 'lucide-react'
// @react-pdf/renderer + InvoicePDFDocument carregam só quando a usuária
// baixa a fatura (lazy no handler). Tira ~1.5MB do bundle de /billing.
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { logger } from '@/services/logger'
import {
  useBilling,
  useBillingInvoices,
  useBillingUsage,
  useCancelSubscription,
  useCustomerPortal,
  type BillingSubscription,
  type BillingInvoice,
  type BillingUsage,
} from '@/features/billing/hooks/useBilling'

const currencyFormat = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

const dateFormat = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function BillingPage() {
  const navigate = useNavigate()
  const { isOwner, loading: orgLoading } = useOrganization()
  const { data: subscription, isLoading: subLoading } = useBilling()
  const { data: invoices = [], isLoading: invLoading } = useBillingInvoices()
  const { data: usage } = useBillingUsage()
  const cancel = useCancelSubscription()
  const portal = useCustomerPortal()
  const [cancelDialog, setCancelDialog] = useState(false)

  if (subLoading || orgLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    )
  }

  if (!isOwner) {
    return <AssistantLockedState />
  }

  const noActiveSubscription =
    !subscription || (!subscription.isActive && !subscription.stripeSubscriptionId)

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col gap-3 pb-8 border-b border-white/5">
          <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
            Conta
          </span>
          <h1 className="font-serif text-4xl md:text-5xl tracking-wide">
            Assinatura
          </h1>
          <p className="text-white/40 text-sm max-w-xl">
            Gerencie seu plano, revise seu histórico de pagamentos e atualize sua
            assinatura a qualquer momento.
          </p>
        </header>

        {noActiveSubscription ? (
          <EmptyState onChoose={() => navigate('/planos')} />
        ) : (
          <>
            <SubscriptionCard subscription={subscription!} />
            {usage && subscription?.planConfig && (
              <UsageSection usage={usage} plan={subscription.planConfig} />
            )}
            <InvoicesSection invoices={invoices} loading={invLoading} />
            <PaymentMethodSection
              onOpenPortal={() => portal.mutate()}
              busy={portal.isPending}
            />
            <DangerZone
              subscription={subscription!}
              onCancel={() => setCancelDialog(true)}
              onReactivate={() => cancel.mutate('reactivate')}
              busy={cancel.isPending}
              onChangePlan={() => navigate('/planos')}
            />
          </>
        )}
      </div>

      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent className="bg-black border border-white/10 rounded-none text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Cancelar assinatura?
            </DialogTitle>
            <DialogDescription className="text-white/50 text-sm leading-relaxed">
              {subscription?.planExpiresAt
                ? `Você continua com acesso completo até ${dateFormat(subscription.planExpiresAt)}. Depois dessa data, a conta retorna ao plano gratuito e você perde recursos premium.`
                : 'Você continua com acesso até o fim do período atual. Depois, a conta retorna ao plano gratuito e você perde recursos premium.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelDialog(false)}
              disabled={cancel.isPending}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                cancel.mutate('cancel_at_period_end', {
                  onSuccess: () => setCancelDialog(false),
                })
              }}
              disabled={cancel.isPending}
            >
              {cancel.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Confirmar cancelamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AssistantLockedState() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-white/10 bg-white/[0.02] p-10 text-center space-y-6">
        <Lock className="w-8 h-8 text-white/30 mx-auto" />
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
            Acesso restrito
          </p>
          <p className="font-serif text-2xl">Apenas a profissional responsável</p>
          <p className="text-white/40 text-sm leading-relaxed">
            A gestão de assinatura e cobrança é feita pela conta principal da
            equipe. Peça acesso para a profissional responsável pela conta.
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onChoose }: { onChoose: () => void }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-12 text-center space-y-6">
      <CreditCard className="w-10 h-10 text-white/20 mx-auto" />
      <div className="space-y-3">
        <p className="font-serif text-2xl">Você ainda não tem um plano ativo</p>
        <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
          Todos os planos começam com 14 dias grátis — você só paga se decidir
          continuar depois do trial. Organize clientes, contratos, agenda e
          portal da noiva em um lugar só.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <Button variant="primary" onClick={onChoose}>
          Começar teste grátis de 14 dias
          <ArrowUpRight className="w-4 h-4 ml-1" />
        </Button>
        <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
          Sem cobrança agora · Cancela quando quiser
        </p>
      </div>
    </div>
  )
}

function SubscriptionCard({ subscription }: { subscription: BillingSubscription }) {
  const status = resolveStatus(subscription)
  const planLabel =
    subscription.planConfig?.display_name ?? subscription.planType

  return (
    <section className="border border-white/10 bg-white/[0.02] p-8 lg:p-10">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
        <div className="space-y-3">
          <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
            Plano atual
          </span>
          <div className="flex items-baseline gap-4">
            <h2 className="font-serif text-3xl lg:text-4xl tracking-wide capitalize">
              {planLabel}
            </h2>
            <StatusBadge tone={status.tone} label={status.label} />
          </div>
          {subscription.monthlyPrice != null && (
            <p className="text-white/50 text-sm">
              {currencyFormat(subscription.monthlyPrice)}
              <span className="text-white/30"> / mês</span>
            </p>
          )}
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm">
          {subscription.isTrialing && (
            <Detail
              label="Trial termina em"
              value={`${subscription.trialDaysRemaining} ${subscription.trialDaysRemaining === 1 ? 'dia' : 'dias'}`}
            />
          )}
          <Detail label="Início" value={dateFormat(subscription.planStartedAt)} />
          <Detail
            label="Próxima renovação"
            value={dateFormat(subscription.planExpiresAt)}
          />
        </dl>
      </div>
    </section>
  )
}

function UsageSection({
  usage,
  plan,
}: {
  usage: BillingUsage
  plan: NonNullable<BillingSubscription['planConfig']>
}) {
  const items = [
    {
      icon: Users,
      label: 'Clientes',
      used: usage.clientsUsed,
      limit: plan.max_clients,
    },
    {
      icon: UserCheck,
      label: 'Assistentes',
      used: usage.assistantsUsed,
      limit: plan.max_team_members,
    },
    {
      icon: FolderKanban,
      label: 'Projetos no mês',
      used: usage.projectsThisMonth,
      limit: plan.max_projects_per_month,
    },
  ]

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
          Uso do plano
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
        {items.map((item) => (
          <UsageCell key={item.label} {...item} />
        ))}
      </div>
    </section>
  )
}

function UsageCell({
  icon: Icon,
  label,
  used,
  limit,
}: {
  icon: typeof Users
  label: string
  used: number
  limit: number | null
}) {
  const unlimited = limit == null
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100))
  const isHot = !unlimited && pct >= 80

  return (
    <div className="bg-black p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-white/40" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
            {label}
          </span>
        </div>
        <span className="font-mono text-xs text-white/60">
          {used}
          <span className="text-white/30"> / {unlimited ? '∞' : limit}</span>
        </span>
      </div>
      {!unlimited && (
        <div className="h-px w-full bg-white/5 relative overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all ${isHot ? 'bg-red-500/70' : 'bg-white/60'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

function InvoicesSection({
  invoices,
  loading,
}: {
  invoices: BillingInvoice[]
  loading: boolean
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
          Histórico de pagamentos
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      {loading ? (
        <div className="border border-white/10 bg-white/[0.02] p-10 flex justify-center">
          <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="border border-white/5 bg-white/[0.01] py-14 text-center">
          <Receipt className="w-6 h-6 text-white/15 mx-auto mb-3" />
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
            Nenhum pagamento ainda
          </p>
          <p className="text-white/20 text-sm mt-2">
            Suas faturas aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="border border-white/10 bg-white/[0.02] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 font-mono text-[10px] text-white/40 uppercase tracking-widest">
                <th className="text-left px-6 py-4">Fatura</th>
                <th className="text-left px-6 py-4">Data</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-right px-6 py-4">Valor</th>
                <th className="text-right px-6 py-4 w-24">PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <InvoiceRow key={inv.id} invoice={inv} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function InvoiceRow({ invoice }: { invoice: BillingInvoice }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadInvoicePDF(invoice)
    } catch (err) {
      logger.error(err, 'InvoiceRow.handleDownload')
      toast.error('Não foi possível gerar o PDF.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="px-6 py-4 font-mono text-xs text-white/80">
        {invoice.invoice_number ?? invoice.id.slice(0, 8).toUpperCase()}
      </td>
      <td className="px-6 py-4 text-white/60">
        {dateFormat(invoice.paid_at ?? invoice.created_at)}
      </td>
      <td className="px-6 py-4">
        <InvoiceStatus status={invoice.status} />
      </td>
      <td className="px-6 py-4 text-right font-mono text-white/80">
        {currencyFormat(invoice.amount)}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center justify-center w-8 h-8 border border-white/10 hover:border-white/40 hover:bg-white/5 transition-colors disabled:opacity-50"
          title="Baixar PDF"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white/60" />
          ) : (
            <Download className="w-3.5 h-3.5 text-white/60" />
          )}
        </button>
      </td>
    </tr>
  )
}

async function downloadInvoicePDF(invoice: BillingInvoice) {
  const { data: invoiceFull, error: invErr } = await supabase
    .from('invoices')
    .select(
      `
      id, user_id, project_id, client_id,
      project:projects(name, event_date),
      client:wedding_clients(full_name, email, phone, cpf)
      `,
    )
    .eq('id', invoice.id)
    .maybeSingle()

  if (invErr) throw invErr

  const ownerId = invoiceFull?.user_id
  if (!ownerId) throw new Error('Invoice sem user_id')

  const { data: issuer, error: issErr } = await supabase
    .from('makeup_artists')
    .select('business_name, cpf, phone, address')
    .eq('user_id', ownerId)
    .maybeSingle()

  if (issErr) throw issErr

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', ownerId)
    .maybeSingle()

  const client = Array.isArray(invoiceFull?.client)
    ? invoiceFull?.client[0]
    : invoiceFull?.client
  const project = Array.isArray(invoiceFull?.project)
    ? invoiceFull?.project[0]
    : invoiceFull?.project

  const [{ pdf }, { InvoicePDFDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/features/billing/components/InvoicePDFDocument'),
  ])

  const doc = (
    <InvoicePDFDocument
      invoice={{
        number: invoice.invoice_number ?? invoice.id.slice(0, 8).toUpperCase(),
        amount: invoice.amount,
        status: invoice.status ?? 'pending',
        createdAt: invoice.created_at,
        dueDate: invoice.due_date,
        paidAt: invoice.paid_at,
      }}
      issuer={{
        businessName: issuer?.business_name ?? 'Profissional',
        cpf: issuer?.cpf ?? null,
        email: profile?.email ?? null,
        phone: issuer?.phone ?? null,
        address: issuer?.address ?? null,
      }}
      client={
        client
          ? {
              name: client.full_name ?? null,
              email: client.email ?? null,
              phone: client.phone ?? null,
              cpf: client.cpf ?? null,
            }
          : null
      }
      project={
        project
          ? {
              name: project.name ?? null,
              eventDate: project.event_date ?? null,
            }
          : null
      }
    />
  )

  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `fatura-${invoice.invoice_number ?? invoice.id.slice(0, 8)}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

function PaymentMethodSection({
  onOpenPortal,
  busy,
}: {
  onOpenPortal: () => void
  busy: boolean
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
          Pagamento
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      <div className="border border-white/10 bg-white/[0.02] p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-white/60" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/60">
              Atualizar cartão · ver faturas Stripe · alterar dados de cobrança
            </p>
          </div>
          <p className="text-white/40 text-sm leading-relaxed">
            Tudo num portal seguro hospedado pelo Stripe. Você pode trocar o
            cartão, baixar faturas históricas e atualizar endereço de cobrança.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onOpenPortal}
          disabled={busy}
          className="md:min-w-[200px]"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Abrir portal de cobrança
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </section>
  )
}

function DangerZone({
  subscription,
  onCancel,
  onReactivate,
  onChangePlan,
  busy,
}: {
  subscription: BillingSubscription
  onCancel: () => void
  onReactivate: () => void
  onChangePlan: () => void
  busy: boolean
}) {
  const isPendingCancellation = subscription.planStatus === 'cancel_at_period_end'

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
          Ações
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-white/10 bg-white/[0.02] p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-white/60" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/60">
              Trocar de plano
            </p>
          </div>
          <p className="text-white/40 text-sm leading-relaxed">
            Faça upgrade ou downgrade do seu plano a qualquer momento.
          </p>
          <Button variant="outline" onClick={onChangePlan} className="w-full">
            Ver planos
          </Button>
        </div>

        <div className="border border-red-500/20 bg-red-950/5 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-red-500/80">
              {isPendingCancellation ? 'Cancelamento agendado' : 'Zona de risco'}
            </p>
          </div>
          {isPendingCancellation ? (
            <>
              <p className="text-white/40 text-sm leading-relaxed">
                Sua assinatura será encerrada em{' '}
                {dateFormat(subscription.planExpiresAt)}. Reative para manter o
                acesso.
              </p>
              <Button
                variant="outline"
                onClick={onReactivate}
                disabled={busy}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reativar assinatura
              </Button>
            </>
          ) : (
            <>
              <p className="text-white/40 text-sm leading-relaxed">
                Cancele a qualquer momento. Seu acesso continua até o fim do
                período já pago.
              </p>
              <Button
                variant="destructive"
                onClick={onCancel}
                disabled={busy}
                className="w-full"
              >
                Cancelar assinatura
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="font-mono text-[10px] text-white/30 tracking-widest uppercase">
        {label}
      </dt>
      <dd className="text-white/80 font-mono text-sm">{value}</dd>
    </div>
  )
}

function StatusBadge({
  tone,
  label,
}: {
  tone: 'active' | 'trial' | 'warning' | 'cancelled'
  label: string
}) {
  const styles = {
    active: 'border-white/30 text-white/70',
    trial: 'border-white/40 text-white',
    warning: 'border-yellow-500/40 text-yellow-500',
    cancelled: 'border-red-500/40 text-red-500',
  }
  return (
    <span
      className={`font-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 ${styles[tone]}`}
    >
      {label}
    </span>
  )
}

function InvoiceStatus({ status }: { status: string | null }) {
  const normalized = (status ?? '').toLowerCase()
  if (normalized === 'paid' || normalized === 'succeeded') {
    return <StatusBadge tone="active" label="Pago" />
  }
  if (normalized === 'pending' || normalized === 'open') {
    return <StatusBadge tone="trial" label="Aberto" />
  }
  if (normalized === 'failed' || normalized === 'past_due') {
    return <StatusBadge tone="cancelled" label="Falhou" />
  }
  return <StatusBadge tone="warning" label={status ?? '—'} />
}

function resolveStatus(
  sub: BillingSubscription,
): { tone: 'active' | 'trial' | 'warning' | 'cancelled'; label: string } {
  if (sub.planStatus === 'cancel_at_period_end') {
    return { tone: 'warning', label: 'Cancelamento agendado' }
  }
  if (sub.planStatus === 'cancelled') return { tone: 'cancelled', label: 'Cancelado' }
  if (sub.planStatus === 'past_due') return { tone: 'cancelled', label: 'Pagamento pendente' }
  if (sub.isTrialing) return { tone: 'trial', label: 'Trial' }
  if (sub.isActive) return { tone: 'active', label: 'Ativo' }
  return { tone: 'warning', label: sub.planStatus ?? 'Inativo' }
}
