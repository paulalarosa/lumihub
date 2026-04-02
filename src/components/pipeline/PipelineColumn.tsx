import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@/components/ui/badge'
import { LeadCard } from './LeadCard'
import type { PipelineLead } from '@/features/pipeline/pages/SalesPipeline'

interface PipelineColumnProps {
  id: string
  name: string
  color?: string
  leads: PipelineLead[]
}

export const PipelineColumn = memo(
  ({ id, name, color, leads }: PipelineColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({
      id: id,
    })

    return (
      <div
        ref={setNodeRef}
        className={`w-80 flex flex-col h-full bg-neutral-900/30 rounded-lg border border-neutral-800/50 transition-colors ${
          isOver ? 'bg-neutral-800/50' : ''
        }`}
      >
        {}
        <div
          className="p-3 border-t-4 bg-neutral-900 rounded-t-lg shadow-sm"
          style={{ borderColor: color }}
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-white truncate px-1" title={name}>
              {name}
            </h3>
            <Badge
              variant="secondary"
              className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            >
              {leads.length}
            </Badge>
          </div>
        </div>

        {}
        <div className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          <SortableContext
            items={leads.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </SortableContext>
        </div>
      </div>
    )
  },
)

PipelineColumn.displayName = 'PipelineColumn'
