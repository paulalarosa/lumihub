import { supabase } from '@/integrations/supabase/client'
import { ProjectDB } from '@/types/calendar'

export interface DashboardEvent {
  id: string
  title: string
  date: string
  time?: string
  type: 'google' | 'project' | 'internal'
  clientName?: string
}

export const EventService = {
  async getUpcomingEvents(
    organizationId: string,
    userId: string,
    _role?: string,
  ) {
    const typedSupabase = supabase

    const { data: tokenData } = await typedSupabase
      .from('google_calendar_tokens')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    const isGoogleConnected = !!tokenData

    let dashboardEvents: DashboardEvent[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*, client:wedding_clients(full_name)')
        .eq('user_id', userId)
        .gte('event_date', today.toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(5)

      const projects = projectsData as (ProjectDB & {
        client: { full_name: string } | { full_name: string }[] | null
      })[]

      const projectEvents: DashboardEvent[] = (projects || []).map((p) => {
        const clientName = Array.isArray(p.client)
          ? p.client[0]?.full_name
          : p.client?.full_name
        return {
          id: p.id,
          title: clientName || 'Projeto',
          date: p.event_date,
          time: p.event_time?.slice(0, 5),
          type: 'project',
          clientName: clientName,
        }
      })

      const { data: googleEventsData } = await typedSupabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'personal')
        .gte('start_time', today.toISOString())
        .order('start_time', { ascending: true })
        .limit(5)

      const googleEvents = googleEventsData

      const externalEvents: DashboardEvent[] = (googleEvents || []).map(
        (e) => ({
          id: e.id,
          title: e.title,
          date: e.start_time,
          time: new Date(e.start_time).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          type: 'google',
        }),
      )

      dashboardEvents = [...projectEvents, ...externalEvents]
        .sort((a, b) => {
          const dateA = new Date(a.date + (a.time ? 'T' + a.time : ''))
          const dateB = new Date(b.date + (b.time ? 'T' + b.time : ''))
          return dateA.getTime() - dateB.getTime()
        })
        .slice(0, 5)
    } catch (e) {
      void e
    }

    return { events: dashboardEvents, isGoogleConnected }
  },
}
