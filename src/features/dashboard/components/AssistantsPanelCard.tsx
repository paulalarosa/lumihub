import { Link } from 'react-router-dom'
import { Users, Plus, ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'

interface Assistant {
  id: string
  full_name: string
  phone: string | null
}

export function AssistantsPanelCard() {
  const { organizationId } = useOrganization()

  const { data: assistants = [], isLoading } = useQuery({
    queryKey: ['dashboard-assistants', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      const { data, error } = await supabase
        .from('assistants')
        .select('id, full_name, phone')
        .eq('user_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(4)
      if (error) throw error
      return (data || []) as Assistant[]
    },
    enabled: !!organizationId,
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    )
  }

  if (assistants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="w-8 h-8 text-white/10 mb-3" />
        <p className="text-sm text-white/20 mb-4">Nenhuma assistente cadastrada</p>
        <Link to="/assistentes">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white transition-colors uppercase tracking-widest border border-white/10 hover:border-white/30 px-4 py-2">
            <Plus className="w-3 h-3" />
            Cadastrar Assistente
          </span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {assistants.map((assistant) => (
        <div
          key={assistant.id}
          className="flex items-center gap-3 p-3 border border-white/[0.06] hover:border-white/20 transition-colors group"
        >
          <div className="w-8 h-8 bg-white/[0.06] flex items-center justify-center text-xs font-mono text-white/60 flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
            {assistant.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/90 truncate">{assistant.full_name}</p>
            {assistant.phone && (
              <p className="text-xs text-white/30 font-mono truncate">{assistant.phone}</p>
            )}
          </div>
          <div className="w-1.5 h-1.5 bg-white/25 rounded-full flex-shrink-0" />
        </div>
      ))}

      <Link
        to="/assistentes"
        className="flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest border border-white/[0.04] hover:border-white/10 mt-1"
      >
        Ver todas
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
