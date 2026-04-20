import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { useOrganization } from '@/hooks/useOrganization'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

interface Project {
  id: string
  name: string
  event_type: string | null
  event_date: string | null
  event_location: string | null
  total_budget: number | null
  status: string
  created_at: string
  client: {
    id: string
    full_name: string
  } | null
}

export type StatusFilter = 'all' | 'active' | 'completed' | 'archived'

export type { Project }

export function useProjectsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { organizationId } = useOrganization()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const preselectedClientId = searchParams.get('cliente') || undefined

  useRealtimeInvalidate({
    table: 'projects',
    invalidate: ['projects'],
    filter: organizationId ? `user_id=eq.${organizationId}` : undefined,
    enabled: !!organizationId,
    channelName: 'rt-projects',
  })

  const { data: projects = [], isLoading: loadingData } = useQuery({
    queryKey: ['projects', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, event_type, event_date, event_location, total_budget, status, created_at, client:wedding_clients(id, full_name)')
        .eq('user_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as Project[]
    },
    enabled: !!user && !!organizationId,
  })

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.client?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.event_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.event_location || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        project.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      thisMonth: projects.filter(p => new Date(p.created_at) >= thisMonthStart).length,
    }
  }, [projects])

  return {
    user,
    loading: authLoading,
    loadingData,
    projects,
    filteredProjects,
    stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    preselectedClientId,
    navigate,
  }
}
