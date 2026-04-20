import { useState } from 'react'
import { Plus, Zap, Play, Pause, Trash2, Loader2 } from 'lucide-react'
import { useWorkflows, type Workflow } from '../hooks/useWorkflows'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { WorkflowAnalytics } from '../components/WorkflowAnalytics'

const TRIGGER_OPTIONS = [
  {
    value: 'invoice_paid',
    label: 'Fatura paga',
    description: 'Quando uma fatura muda pra status "paid"',
  },
  {
    value: 'event_created',
    label: 'Evento criado',
    description: 'Quando um novo evento entra na agenda',
  },
  {
    value: 'client_created',
    label: 'Cliente criada',
    description: 'Quando uma nova cliente é cadastrada',
  },
  {
    value: 'contract_signed',
    label: 'Contrato assinado',
    description: 'Quando uma cliente assina um contrato',
  },
  {
    value: 'lead_converted',
    label: 'Lead convertida',
    description: 'Quando uma lead vira cliente (won)',
  },
]

const ACTION_TEMPLATES = {
  welcome_email: {
    type: 'send_email',
    to_from: 'payload_client_email',
    subject: 'Olá, {{full_name}}!',
    body:
      '<p>Oi {{full_name}},</p><p>Que alegria ter você por aqui! Em breve entro em contato para alinharmos os próximos passos.</p>',
  },
  thankyou_email: {
    type: 'send_email',
    to_from: 'payload_client_email',
    subject: 'Obrigada pelo pagamento',
    body:
      '<p>Recebemos seu pagamento de R$ {{amount}}. Muito obrigada pela confiança!</p>',
  },
  followup_task: {
    type: 'create_task',
    title: 'Follow-up: {{full_name}}',
    due_in_days: 3,
  },
  notify_me: {
    type: 'notify',
    channel: 'in_app',
    title: 'Nova ação',
    message: 'Um workflow acabou de rodar.',
  },
}

export default function WorkflowsPage() {
  const { list, create, remove, toggle } = useWorkflows()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [trigger, setTrigger] = useState('')
  const [actionsText, setActionsText] = useState(
    JSON.stringify([ACTION_TEMPLATES.welcome_email], null, 2),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setDescription('')
    setTrigger('')
    setActionsText(JSON.stringify([ACTION_TEMPLATES.welcome_email], null, 2))
    setError(null)
  }

  const handleCreate = async () => {
    setError(null)
    if (!name.trim() || !trigger) {
      setError('Preencha nome e gatilho')
      return
    }
    let actions
    try {
      actions = JSON.parse(actionsText)
      if (!Array.isArray(actions)) throw new Error('Deve ser um array')
    } catch (e) {
      setError(`JSON inválido em ações: ${(e as Error).message}`)
      return
    }
    setSaving(true)
    try {
      await create.mutateAsync({
        name,
        description,
        trigger_type: trigger,
        actions,
      })
      reset()
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const loadTemplate = (tpl: keyof typeof ACTION_TEMPLATES) => {
    setActionsText(JSON.stringify([ACTION_TEMPLATES[tpl]], null, 2))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-white">
            Automações
          </h1>
          <p className="text-sm text-white/60">
            Dispare ações automáticas quando algo acontece no sistema.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="rounded-none bg-white text-black hover:bg-zinc-200 h-10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo workflow
        </Button>
      </header>

      <WorkflowAnalytics />

      {list.isLoading && (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-white/40" />
        </div>
      )}

      {list.data && list.data.length === 0 && (
        <div className="py-16 text-center border border-dashed border-white/10 px-6">
          <Zap className="w-10 h-10 mx-auto text-white/20 mb-3" />
          <p className="text-white/70 text-sm">Nenhum workflow ainda</p>
          <p className="text-white/40 text-xs mt-1">
            Crie o primeiro pra começar a automatizar.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.data?.map((w) => (
          <WorkflowCard
            key={w.id}
            workflow={w}
            onToggle={() => toggle(w)}
            onDelete={() => remove.mutate(w.id)}
          />
        ))}
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) reset()
        }}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-white">
              Novo workflow
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Nome
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Boas-vindas a nova cliente"
                className="rounded-none border-zinc-800 bg-zinc-900/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Descrição (opcional)
              </Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="O que esse workflow faz"
                className="rounded-none border-zinc-800 bg-zinc-900/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Gatilho
              </Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger className="rounded-none border-zinc-800 bg-zinc-900/50">
                  <SelectValue placeholder="Escolha quando disparar" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-zinc-800 bg-zinc-950">
                  {TRIGGER_OPTIONS.map((t) => (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                      className="rounded-none"
                    >
                      <span className="block">{t.label}</span>
                      <span className="block text-[10px] text-white/40">
                        {t.description}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                  Ações (JSON)
                </Label>
                <div className="flex gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => loadTemplate('welcome_email')}
                    className="text-[10px] text-white/60 hover:text-white px-2 py-1 border border-zinc-800 hover:border-zinc-600"
                  >
                    email boas-vindas
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplate('thankyou_email')}
                    className="text-[10px] text-white/60 hover:text-white px-2 py-1 border border-zinc-800 hover:border-zinc-600"
                  >
                    obrigada pagamento
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplate('followup_task')}
                    className="text-[10px] text-white/60 hover:text-white px-2 py-1 border border-zinc-800 hover:border-zinc-600"
                  >
                    criar tarefa
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplate('notify_me')}
                    className="text-[10px] text-white/60 hover:text-white px-2 py-1 border border-zinc-800 hover:border-zinc-600"
                  >
                    me notificar
                  </button>
                </div>
              </div>
              <Textarea
                value={actionsText}
                onChange={(e) => setActionsText(e.target.value)}
                rows={10}
                className="rounded-none border-zinc-800 bg-zinc-900/50 font-mono text-xs"
              />
              <p className="text-[10px] text-white/40">
                Use {`{{full_name}}`}, {`{{amount}}`}, {`{{event_date}}`}
                {' '}etc. para inserir dados do gatilho.
              </p>
            </div>

            {error && (
              <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-none border-zinc-800"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !name || !trigger}
              className="rounded-none bg-white text-black hover:bg-zinc-200"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Criar workflow'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function WorkflowCard({
  workflow,
  onToggle,
  onDelete,
}: {
  workflow: Workflow
  onToggle: () => void
  onDelete: () => void
}) {
  const triggerLabel =
    TRIGGER_OPTIONS.find((t) => t.value === workflow.trigger_type)?.label ??
    workflow.trigger_type

  return (
    <div
      className={`p-5 border rounded-none transition-colors ${
        workflow.is_active
          ? 'border-white/10 bg-white/[0.02]'
          : 'border-white/5 bg-transparent opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-white text-sm truncate">
            {workflow.name}
          </h3>
          {workflow.description && (
            <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
              {workflow.description}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest border ${
            workflow.is_active
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
              : 'text-white/40 border-white/10'
          }`}
        >
          <span
            className={`w-1 h-1 rounded-full ${
              workflow.is_active ? 'bg-emerald-400' : 'bg-white/40'
            }`}
          />
          {workflow.is_active ? 'Ativo' : 'Pausado'}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
          Gatilho
        </p>
        <p className="text-xs text-white">{triggerLabel}</p>
      </div>

      <div className="space-y-1.5 mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
          Ações
        </p>
        <p className="text-xs text-white/70">
          {workflow.actions.length} ação{workflow.actions.length > 1 ? 'ões' : ''}
          {' · '}
          {workflow.actions.map((a) => a.type).join(', ')}
        </p>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-3 border-t border-white/5">
        <span>
          {workflow.run_count} execução{workflow.run_count !== 1 ? 'ões' : ''}
        </span>
        {workflow.last_run_at && (
          <span>
            última{' '}
            {formatDistanceToNow(new Date(workflow.last_run_at), {
              locale: ptBR,
              addSuffix: true,
            })}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="flex-1 rounded-none border-white/10 h-8 text-[10px] uppercase tracking-widest"
        >
          {workflow.is_active ? (
            <>
              <Pause className="w-3 h-3 mr-1.5" /> Pausar
            </>
          ) : (
            <>
              <Play className="w-3 h-3 mr-1.5" /> Ativar
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm(`Remover "${workflow.name}"?`)) onDelete()
          }}
          className="rounded-none border-red-900/50 text-red-500 hover:bg-red-500 hover:text-black h-8 px-3"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}
