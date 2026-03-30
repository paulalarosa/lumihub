import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { useAuth } from '@/hooks/useAuth'
import { startOfMonth } from 'date-fns/startOfMonth'
import { endOfMonth } from 'date-fns/endOfMonth'
import { format } from 'date-fns/format'

// Define manual type since Supabase types seem mismatched
export interface Assistant {
  id: string
  assistant_user_id: string | null
  user_id: string
  full_name: string
  email: string | null
  phone: string | null
  role: 'assistant' | 'admin' | 'viewer'
  status: 'pending' | 'accepted' | 'rejected'
  invite_token: string | null
  is_registered: boolean
  created_at: string
  updated_at: string
}

type LocalDatabase = Database & {
  public: {
    Tables: {
      assistants: {
        Row: Assistant
        Insert: Partial<Assistant>
        Update: Partial<Assistant>
        Relationships: []
      }
    }
  }
}

export const usePortal = (currentMonth: Date, selectedAssistantId: string) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // 1. Fetch Assistants Records
  const assistantsQuery = useQuery({
    queryKey: ['portal-assistants', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('assistants')
        .select('*')
        .or(`assistant_user_id.eq.${user.id},email.eq.${user.email}`)

      if (error) throw error
      // Force cast to correct type
      return data || []
    },
    enabled: !!user,
  })

  const assistantsList = assistantsQuery.data || []

  // 2. Fetch Employers (Profiles)
  const employersQuery = useQuery({
    queryKey: [
      'portal-employers',
      assistantsList.map((a) => a.user_id).join(','),
    ],
    queryFn: async () => {
      const employerIds = [...new Set(assistantsList.map((r) => r.user_id))]
      if (employerIds.length === 0) return {}

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', employerIds)

      const map: Record<string, string> = {}
      data?.forEach((p) => {
        map[p.id] = p.full_name
      })
      return map
    },
    enabled: assistantsList.length > 0,
  })

  // 3. Fetch Events & Tasks
  const activeRecords = assistantsList.filter(
    (r) =>
      (r.status === 'accepted' || r.is_registered) &&
      (selectedAssistantId === 'all' || r.id === selectedAssistantId),
  )

  const eventsQuery = useQuery({
    queryKey: [
      'portal-events',
      currentMonth,
      activeRecords.map((r) => r.id).join(','),
    ],
    queryFn: async () => {
      if (activeRecords.length === 0) return []

      const assistantIds = activeRecords.map((r) => r.id)
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)

      const { data: eventAssignments } = await supabase
        .from('event_assistants')
        .select('event_id')
        .in('assistant_id', assistantIds)

      if (!eventAssignments || eventAssignments.length === 0) return []

      const eventIds = eventAssignments.map((ea) => ea.event_id)

      const { data } = await supabase
        .from('events')
        .select('*, client:wedding_clients(full_name), projects(name)')
        .in('id', eventIds)
        .gte('event_date', format(start, 'yyyy-MM-dd'))
        .lte('event_date', format(end, 'yyyy-MM-dd'))
        .order('event_date', { ascending: true })

      return data || []
    },
    enabled: activeRecords.length > 0,
  })

  // Actions
  const acceptInvite = async (assistantRecordId: string) => {
    // Use typed client with LocalDatabase
    const typedSupabase = supabase

    const { error } = await typedSupabase
      .from('assistants')
      .update({
        status: 'accepted',
        is_registered: true,
        assistant_user_id: user?.id,
        invite_token: null,
      })
      .eq('id', assistantRecordId)

    if (error) throw error
    queryClient.invalidateQueries({ queryKey: ['portal-assistants'] })
  }

  return {
    assistantsList,
    employersMap: employersQuery.data || {},
    events: eventsQuery.data || [],
    isLoading:
      assistantsQuery.isLoading ||
      employersQuery.isLoading ||
      eventsQuery.isLoading,
    acceptInvite,
  }
}
