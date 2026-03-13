import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { logger } from '@/services/logger'
import { QUERY_KEYS } from '@/constants/queryKeys'

interface CreateLeadDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface LeadFormData {
  name: string
  email: string
  phone: string
  event_type: string
  event_date: string
  estimated_budget: string
  source: string
  notes: string
}

export const CreateLeadDialog = ({
  isOpen,
  onClose,
}: CreateLeadDialogProps) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset } = useForm<LeadFormData>()
  const [isLoading, setIsLoading] = useState(false)

  const createLead = useMutation({
    mutationFn: async (data: LeadFormData) => {
      // 1. Get default stage
      const { data: stages }: any = await (
        supabase
          .from('pipeline_stages' as any)
          .select('id')
          .eq('user_id', user?.id)
          .eq('is_default', true)
          .eq('stage_type', 'lead') as any
      ).single()

      let stageId = stages?.id

      // Fallback if no specific default lead stage found, take the first one
      if (!stageId) {
        const { data: firstStage }: any = await (
          supabase
            .from('pipeline_stages' as any)
            .select('id')
            .eq('user_id', user?.id)
            .order('display_order', { ascending: true })
            .limit(1) as any
        ).single()
        stageId = firstStage?.id
      }

      if (!stageId)
        throw new Error(
          'Nenhum estágio de pipeline encontrado. Crie os estágios primeiro.',
        )

      const { error } = await (supabase.from('leads' as any).insert({
        user_id: user?.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        event_type: data.event_type || null,
        event_date: data.event_date || null,
        estimated_budget: data.estimated_budget
          ? parseFloat(data.estimated_budget)
          : null,
        source: data.source || 'manual',
        notes: data.notes || null,
        current_stage_id: stageId,
        status: 'active',
      } as any) as any)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PIPELINE_LEADS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_METRICS] })
      toast.success('Lead criado com sucesso!')
      reset()
      onClose()
    },
    onError: (error) => {
      logger.error('Error creating lead:', error)
      toast.error('Erro ao criar lead: ' + error.message)
    },

    onSettled: () => {
      setIsLoading(false)
    },
  })

  const onSubmit = (data: LeadFormData) => {
    setIsLoading(true)
    createLead.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-900 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nome do Cliente *</Label>
              <Input
                id="name"
                {...register('name', { required: true })}
                className="bg-neutral-800 border-neutral-700"
                placeholder="Ex: Maria Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="bg-neutral-800 border-neutral-700"
                placeholder="cliente@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                {...register('phone')}
                className="bg-neutral-800 border-neutral-700"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_type">Tipo de Evento</Label>
              <Input
                id="event_type"
                {...register('event_type')}
                className="bg-neutral-800 border-neutral-700"
                placeholder="Ex: Casamento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_date">Data do Evento</Label>
              <Input
                id="event_date"
                type="date"
                {...register('event_date')}
                className="bg-neutral-800 border-neutral-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_budget">Orçamento Estimado (R$)</Label>
              <Input
                id="estimated_budget"
                type="number"
                step="0.01"
                {...register('estimated_budget')}
                className="bg-neutral-800 border-neutral-700"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Origem</Label>
              <select
                id="source"
                className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('source')}
              >
                <option value="manual">Manual (Inserido agora)</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="indicacao">Indicação</option>
                <option value="site">Site / Google</option>
                <option value="outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Iniciais</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              className="bg-neutral-800 border-neutral-700"
              placeholder="Detalhes importantes sobre o lead..."
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="hover:bg-neutral-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-black font-semibold"
            >
              {isLoading ? 'Criando...' : 'Criar Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
