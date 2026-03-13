import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, TrendingUp } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { LeadCard } from '@/components/pipeline/LeadCard'
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

  // Buscar estágios
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

  // Buscar leads
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
        // Simple client-side filtering might be better for complex OR logic if Supabase filter is tricky with OR across columns
        // avoiding complex syntax errors, let's use a simpler text search on name for first version or specialized rpc
        // Trying explicit OR syntax
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

  // Mutation: Mover lead entre estágios
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
      // We optimistically updated UI via DnD state or just refetch.
      // React Query refetch will sync everything.
    },
    onError: (error) => {
      toast.error('Erro ao mover card: ' + error.message)
    },
  })

  const handleDragEnd = (result: {
    destination?: { droppableId: string; index: number }
    source: { droppableId: string; index: number }
    draggableId: string
  }) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return

    const newStageId = destination.droppableId
    moveMutation.mutate({ leadId: draggableId, newStageId })
  }

  // Agrupar leads por estágio
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
      {/* Header */}
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

      {/* Filtros */}
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

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 h-full min-w-max pb-4">
            {stages?.map((stage: PipelineStage) => (
              <div
                key={stage.id}
                className="w-80 flex flex-col h-full bg-neutral-900/30 rounded-lg border border-neutral-800/50"
              >
                {/* Stage Header */}
                <div
                  className="p-3 border-t-4 bg-neutral-900 rounded-t-lg shadow-sm"
                  style={{ borderColor: stage.color }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className="font-semibold text-white truncate px-1"
                      title={stage.name}
                    >
                      {stage.name}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    >
                      {leadsByStage[stage.id]?.length || 0}
                    </Badge>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent ${
                        snapshot.isDraggingOver ? 'bg-neutral-800/20' : ''
                      }`}
                    >
                      {leadsByStage[stage.id]?.map(
                        (lead: PipelineLead, index: number) => (
                          <Draggable
                            key={lead.id}
                            draggableId={lead.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{ ...provided.draggableProps.style }}
                                className={
                                  snapshot.isDragging
                                    ? 'opacity-50 rotate-2'
                                    : ''
                                }
                              >
                                <LeadCard lead={lead} />
                              </div>
                            )}
                          </Draggable>
                        ),
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Dialogs */}
      <CreateLeadDialog
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </div>
  )
}

export default SalesPipeline
