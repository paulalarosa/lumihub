import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface DeleteClientDialogProps {
  client: { id: string; name: string | null } | null
  confirmText: string
  onConfirmTextChange: (v: string) => void
  cascadeEvents: boolean
  onCascadeChange: (v: boolean) => void
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

interface LinkedCount {
  events: number
  projects: number
  contracts: number
  invoices: number
}

export function DeleteClientDialog({
  client,
  confirmText,
  onConfirmTextChange,
  cascadeEvents,
  onCascadeChange,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteClientDialogProps) {
  const { data: linked } = useQuery({
    queryKey: ['client-linked-count', client?.id],
    enabled: !!client,
    queryFn: async (): Promise<LinkedCount> => {
      if (!client)
        return { events: 0, projects: 0, contracts: 0, invoices: 0 }
      const [eventsRes, projectsRes, contractsRes, invoicesRes] =
        await Promise.all([
          supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', client.id),
          supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', client.id),
          supabase
            .from('contracts')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', client.id),
          supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', client.id),
        ])
      return {
        events: eventsRes.count ?? 0,
        projects: projectsRes.count ?? 0,
        contracts: contractsRes.count ?? 0,
        invoices: invoicesRes.count ?? 0,
      }
    },
  })

  const open = !!client
  const expectedName = (client?.name ?? '').trim()
  const typedMatches =
    !!expectedName &&
    confirmText.trim().toLowerCase() === expectedName.toLowerCase()
  const totalLinked =
    (linked?.events ?? 0) +
    (linked?.projects ?? 0) +
    (linked?.contracts ?? 0) +
    (linked?.invoices ?? 0)

  const parts: string[] = []
  if (linked?.events) {
    parts.push(`${linked.events} ${linked.events === 1 ? 'evento' : 'eventos'}`)
  }
  if (linked?.projects) {
    parts.push(
      `${linked.projects} ${linked.projects === 1 ? 'projeto' : 'projetos'}`,
    )
  }
  if (linked?.contracts) {
    parts.push(
      `${linked.contracts} ${linked.contracts === 1 ? 'contrato' : 'contratos'}`,
    )
  }
  if (linked?.invoices) {
    parts.push(
      `${linked.invoices} ${linked.invoices === 1 ? 'fatura' : 'faturas'}`,
    )
  }
  const linkedSummary =
    parts.length > 1
      ? `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`
      : parts[0] ?? ''

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent
        className="bg-black border border-white/15 rounded-none text-white max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Excluir cliente?
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm leading-relaxed">
            Esta ação é definitiva e não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div className="p-3 border border-red-900/40 bg-red-950/20">
            <p className="text-xs font-mono uppercase tracking-widest text-red-300 font-bold">
              Você está excluindo
            </p>
            <p className="text-sm text-white mt-1 font-medium">
              {expectedName || 'Cliente sem nome'}
            </p>
          </div>

          {totalLinked > 0 && (
            <div className="p-3 border border-amber-500/30 bg-amber-500/5 space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold">
                Atenção: há dados vinculados
              </p>
              <p className="text-xs text-amber-100/80 leading-relaxed">
                Esta cliente tem <strong>{linkedSummary}</strong> no sistema.
                {(linked?.contracts || linked?.invoices) && (
                  <span className="block mt-1 text-white/50">
                    Contratos e faturas ficam órfãos após a exclusão — o
                    cascade atinge apenas eventos e projetos.
                  </span>
                )}
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <Checkbox
                  checked={cascadeEvents}
                  onCheckedChange={(checked) => onCascadeChange(!!checked)}
                  className="mt-0.5"
                />
                <span className="text-xs text-white/80 leading-relaxed">
                  Excluir também os{' '}
                  {linked?.events ? 'eventos' : ''}
                  {linked?.events && linked?.projects ? ' e ' : ''}
                  {linked?.projects ? 'projetos' : ''} vinculados.
                  <span className="block text-[10px] text-white/40 font-mono mt-1">
                    Se deixar desmarcado, eles ficam órfãos (sem cliente
                    associado).
                  </span>
                </span>
              </label>
            </div>
          )}

          <div>
            <Label
              htmlFor="delete-confirm-name"
              className="text-[10px] font-mono uppercase tracking-widest text-white/50 block mb-1.5"
            >
              Digite o nome da cliente pra confirmar
            </Label>
            <Input
              id="delete-confirm-name"
              value={confirmText}
              onChange={(e) => onConfirmTextChange(e.target.value)}
              placeholder={expectedName}
              className="bg-white/5 border-white/15 text-white placeholder:text-white/20 font-mono text-sm h-11 rounded-none"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="border-white/20 text-white hover:bg-white/5 rounded-none font-mono text-xs uppercase tracking-widest"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!typedMatches || isDeleting}
            className="bg-red-600 text-white hover:bg-red-700 rounded-none font-mono text-xs uppercase tracking-widest"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir definitivamente'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
