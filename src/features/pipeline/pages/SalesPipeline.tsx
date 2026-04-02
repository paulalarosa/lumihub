import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, TrendingUp } from 'lucide-react'
import { PipelineColumn } from '@/components/pipeline/PipelineColumn'
import { CreateLeadDialog } from '@/components/pipeline/CreateLeadDialog'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/constants/queryKeys'

export interface PipelineLead {
  id: string
  name: string
  email?: string
  phone?: string
  event_date?: string
  estimated_budget?: number
  source?: string
  status?: string
  lead_score: number
  event_type?: string
  current_stage_id?: string
  created_at: string
  notes?: string
}

export interface PipelineStage {
  id: string
  name: string
  color?: string
  display_order?: number
}

export const SalesPipeline = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const { data: stages } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('user_id', user?.id)
        .order('display_order')

      if (error) throw error
      return data as PipelineStage[]
    },
    enabled: !!user,
  })

  const { data: leads } = useQuery({
    queryKey: ['pipeline-leads', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('lead_score', { ascending: false })

      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
        )
      }

      const { data, error } = await query
      if (error) throw error
      return data as PipelineLead[]
    },
    enabled: !!user,
  })

  const moveMutation = useMutation({
    mutationFn: async ({
      leadId,
      newStageId,
    }: {
      leadId: string
      newStageId: string
    }) => {
      const { error } = await supabase
        .from('leads')
        .update({ current_stage_id: newStageId })
        .eq('id', leadId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PIPELINE_LEADS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_METRICS] })
    },
    onError: (error) => {
      toast.error('Erro ao mover card: ' + error.message)
    },
  })

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const leadId = active.id as string
      const newStageId = over.id as string

      const lead = leads?.find((l) => l.id === leadId)
      if (!lead || lead.current_stage_id === newStageId) return

      moveMutation.mutate({ leadId, newStageId })
    },
    [leads, moveMutation],
  )

  const leadsByStage =
    stages?.reduce(
      (acc: Record<string, PipelineLead[]>, stage: PipelineStage) => {
        acc[stage.id] =
          leads?.filter(
            (lead: PipelineLead) => lead.current_stage_id === stage.id,
          ) || []
        return acc
      },
      {},
    ) || {}

  return (
    <div className="container mx-auto p-4 md:p-8 h-[calc(100vh-4rem)] flex flex-col">
      {}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Funil de Vendas</h1>
          <p className="text-neutral-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {leads?.length || 0} leads ativos no pipeline
          </p>
        </div>

        <div className="flex gap-2">
          {stages?.length === 0 && (
            <Button
              variant="destructive"
              onClick={async () => {
                const { error } = await supabase.rpc(
                  'create_default_pipeline_stages',
                  { p_user_id: user?.id },
                )
                if (error) toast.error(error.message)
                else {
                  toast.success('Estágios criados!')
                  queryClient.invalidateQueries({
                    queryKey: ['pipeline-stages'],
                  })
                }
              }}
            >
              Inicializar Pipeline
            </Button>
          )}
          <Button
            variant="outline"
            className="hidden sm:flex bg-transparent border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-white text-black hover:bg-neutral-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, email..."
            className="pl-9 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-offset-0 focus-visible:ring-neutral-700"
          />
        </div>
        <Button
          variant="outline"
          className="bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 h-full min-w-max pb-4">
            {stages?.map((stage: PipelineStage) => (
              <PipelineColumn
                key={stage.id}
                id={stage.id}
                name={stage.name}
                color={stage.color}
                leads={leadsByStage[stage.id] || []}
              />
            ))}
          </div>
        </div>
      </DndContext>

      {}
      <CreateLeadDialog
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </div>
  )
}

export default SalesPipeline
