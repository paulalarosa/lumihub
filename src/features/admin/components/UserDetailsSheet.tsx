import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Users,
  FolderKanban,
  Calendar,
  FileSignature,
  UserCheck,
  Receipt,
  CreditCard,
  Loader2,
  Mail,
  Phone,
  Building2,
  Activity,
  Bell,
  Send,
  Database,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useUserDetails } from '../hooks/useUserDetails'
import { useUserTimeline, type TimelineEvent } from '../hooks/useUserTimeline'

const dateFormat = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n)

const STATUS_TONE: Record<string, string> = {
  active: 'border-green-500/30 text-green-400',
  trialing: 'border-yellow-500/30 text-yellow-400',
  cancelled: 'border-red-500/30 text-red-400',
  past_due: 'border-red-500/30 text-red-400',
}

export function UserDetailsSheet({
  userId,
  onClose,
}: {
  userId: string | null
  onClose: () => void
}) {
  const { data: user, isLoading } = useUserDetails(userId)
  const { data: timeline = [] } = useUserTimeline(userId, 30)

  return (
    <Sheet open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-black border-l border-white/20 text-white p-0 overflow-y-auto"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
          </div>
        ) : !user ? (
          <div className="h-full flex items-center justify-center">
            <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
              Usuária não encontrada
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 py-5 border-b border-white/10">
              <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
                Usuária
              </span>
              <SheetTitle className="font-serif text-2xl text-white tracking-wide text-left">
                {user.full_name ?? 'Sem nome'}
              </SheetTitle>
              <div className="flex items-center gap-3 text-white/50 text-sm">
                {user.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </span>
                )}
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    {user.phone}
                  </span>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              <section className="p-6 border-b border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-white/40" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                    Assinatura
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <h3 className="font-serif text-2xl capitalize">
                    {user.plan_type ?? 'Gratuita'}
                  </h3>
                  {user.plan_status && (
                    <span
                      className={`font-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 ${
                        STATUS_TONE[user.plan_status] ?? 'border-white/20 text-white/60'
                      }`}
                    >
                      {user.plan_status}
                    </span>
                  )}
                </div>
                {user.monthly_price != null && (
                  <p className="text-white/50 text-sm">
                    {currency(user.monthly_price)}/mês
                  </p>
                )}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 text-xs">
                  <Field label="Início" value={dateFormat(user.plan_started_at)} />
                  <Field label="Renovação" value={dateFormat(user.plan_expires_at)} />
                  {user.trial_ends_at && (
                    <Field label="Trial até" value={dateFormat(user.trial_ends_at)} />
                  )}
                  <Field label="Stripe Customer" value={user.stripe_customer_id ?? '—'} mono />
                </dl>
              </section>

              <section className="p-6 border-b border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-white/40" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                    Uso da plataforma
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-px bg-white/5">
                  <Counter icon={Users} label="Clientes" value={user.counters.clients} />
                  <Counter icon={FolderKanban} label="Projetos" value={user.counters.projects} />
                  <Counter icon={Calendar} label="Eventos" value={user.counters.events} />
                  <Counter icon={FileSignature} label="Contratos" value={user.counters.contracts} />
                  <Counter icon={Receipt} label="Faturas" value={user.counters.invoices} />
                  <Counter icon={UserCheck} label="Assistentes" value={user.counters.assistants} />
                </div>
              </section>

              <section className="p-6 border-b border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <Receipt className="w-4 h-4 text-white/40" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                    Receita via faturas
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-px bg-white/5">
                  <RevenueTile label="Total" value={user.revenue.total} />
                  <RevenueTile label="Recebido" value={user.revenue.paid} accent="green" />
                  <RevenueTile label="Pendente" value={user.revenue.pending} accent="yellow" />
                </div>
              </section>

              {user.recentInvoices.length > 0 && (
                <section className="p-6 space-y-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/50 block">
                    Faturas recentes
                  </span>
                  <div className="border border-white/10 divide-y divide-white/5">
                    {user.recentInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <p className="font-mono text-xs text-white/80">
                            {inv.invoice_number ?? inv.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest mt-1">
                            {dateFormat(inv.created_at)} · {inv.status ?? '—'}
                          </p>
                        </div>
                        <p className="font-mono text-sm text-white">
                          {currency(inv.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {timeline.length > 0 && (
                <section className="p-6 border-b border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-white/40" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                      Linha do tempo
                    </span>
                    <span className="font-mono text-[9px] text-white/30 ml-auto">
                      {timeline.length} eventos
                    </span>
                  </div>
                  <ol className="relative border-l border-white/10 ml-2 space-y-4">
                    {timeline.map((event) => (
                      <TimelineItem key={event.id} event={event} />
                    ))}
                  </ol>
                </section>
              )}

              <section className="p-6 border-t border-white/5 text-xs space-y-2">
                <Field label="User ID" value={user.id} mono />
                <Field label="Cadastro" value={dateFormat(user.created_at)} />
                {user.business_name && (
                  <Field label="Empresa" value={user.business_name} />
                )}
                {user.role && <Field label="Role" value={user.role} />}
              </section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <dt className="font-mono text-[9px] text-white/30 tracking-widest uppercase mb-0.5">
        {label}
      </dt>
      <dd className={`text-white/80 ${mono ? 'font-mono text-[11px]' : 'text-sm'} break-all`}>
        {value}
      </dd>
    </div>
  )
}

function Counter({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: number
}) {
  return (
    <div className="bg-black p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-white/40" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
          {label}
        </span>
      </div>
      <p className="font-serif text-2xl text-white leading-none">{value}</p>
    </div>
  )
}

function RevenueTile({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'green' | 'yellow'
}) {
  const color =
    accent === 'green'
      ? 'text-green-400'
      : accent === 'yellow'
        ? 'text-yellow-400'
        : 'text-white'
  return (
    <div className="bg-black p-4 space-y-2">
      <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
        {label}
      </span>
      <p className={`font-serif text-lg leading-none ${color}`}>{currency(value)}</p>
    </div>
  )
}

const TIMELINE_ICONS = {
  audit: Database,
  notification: Bell,
  email: Send,
  invoice: Receipt,
} as const

const TIMELINE_COLORS = {
  audit: 'text-blue-400 border-blue-500/30',
  notification: 'text-white/70 border-white/20',
  email: 'text-purple-400 border-purple-500/30',
  invoice: 'text-yellow-400 border-yellow-500/30',
} as const

function TimelineItem({ event }: { event: TimelineEvent }) {
  const Icon = TIMELINE_ICONS[event.type]
  const color = TIMELINE_COLORS[event.type]
  const relative = formatDistanceToNow(new Date(event.timestamp), {
    locale: ptBR,
    addSuffix: true,
  })

  return (
    <li className="ml-4 relative">
      <span
        className={`absolute -left-[calc(1rem+8px)] top-1 w-4 h-4 flex items-center justify-center bg-black border ${color}`}
      >
        <Icon className="w-2.5 h-2.5" />
      </span>
      <div className="space-y-1">
        <p className="text-white text-sm leading-snug">{event.title}</p>
        {event.description && (
          <p className="text-white/40 text-xs break-words">{event.description}</p>
        )}
        <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
          {relative}
        </p>
      </div>
    </li>
  )
}
