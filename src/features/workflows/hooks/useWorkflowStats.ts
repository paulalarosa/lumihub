import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export interface WorkflowExecutionStat {
  workflow_id: string
  user_id: string
  name: string
  trigger_type: string
  is_active: boolean
  total_runs: number
  runs_30d: number
  success_total: number
  failure_total: number
  success_30d: number
  failure_30d: number
  last_run_at: string | null
}

export interface WorkflowExecutionRow {
  id: string
  workflow_id: string
  trigger_payload: Record<string, unknown> | null
  status: string
  error: string | null
  started_at: string
  completed_at: string | null
  workflow_name?: string | null
}

export function useWorkflowStats() {
  const { user } = useAuth()

  useRealtimeInvalidate({
    table: ['workflows', 'workflow_executions'],
    invalidate: [['workflow-stats'], ['workflow-executions-recent']],
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    channelName: 'rt-workflow-stats',
  })

  const stats = useQuery({
    queryKey: ['workflow-stats', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WorkflowExecutionStat[]> => {
      const { data, error } = await supabase
        .from('workflow_execution_stats')
        .select('*')
      if (error) throw error
      return (data ?? []) as WorkflowExecutionStat[]
    },
  })

  const recent = useQuery({
    queryKey: ['workflow-executions-recent', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WorkflowExecutionRow[]> => {
      const { data: execs, error } = await supabase
        .from('workflow_executions')
        .select('id, workflow_id, status, error, started_at, completed_at, trigger_payload')
        .order('started_at', { ascending: false })
        .limit(20)
      if (error) throw error

      const ids = Array.from(
        new Set((execs ?? []).map((e) => e.workflow_id).filter(Boolean)),
      )
      const nameMap = new Map<string, string>()
      if (ids.length > 0) {
        const { data: ws } = await supabase
          .from('workflows')
          .select('id, name')
          .in('id', ids)
        for (const w of ws ?? []) nameMap.set(w.id, w.name)
      }

      return (execs ?? []).map((e) => ({
        ...e,
        workflow_name: nameMap.get(e.workflow_id) ?? null,
      })) as WorkflowExecutionRow[]
    },
  })

  return { stats, recent }
}
