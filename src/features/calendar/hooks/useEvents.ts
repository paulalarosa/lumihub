import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { formatDate } from '@/lib/date-utils'
import { useRealtimeInvalidate } from '@/hooks/useRealtimeInvalidate'

export interface Event {
  id: string
  title: string
  description: string | null
  event_date: string
  event_type?: string | null
  start_time: string | null
  end_time: string | null
  arrival_time?: string | null
  making_of_time?: string | null
  ceremony_time?: string | null
  advisory_time?: string | null
  location: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  notes?: string | null
  color: string
  client_id?: string | null
  project_id?: string | null
  reminder_days?: number[]
  client?: { id: string; name: string; phone?: string; email?: string } | null
  project?: { name: string } | null
  assistants?: { id: string; name: string }[]
  total_value?: number
  payment_method?: string
  payment_status?: 'pending' | 'paid'
  google_calendar_event_id?: string | null
}

export const useEvents = (start: Date, end: Date) => {
  useRealtimeInvalidate({
    table: ['events', 'projects', 'calendar_events', 'wedding_clients'],
    invalidate: ['events'],
    channelName: 'rt-events',
  })

  return useQuery({
    queryKey: [
      'events',
      formatDate(start, 'yyyy-MM-dd'),
      formatDate(end, 'yyyy-MM-dd'),
    ],
    queryFn: async () => {
      const startDate = formatDate(start, 'yyyy-MM-dd')
      const endDate = formatDate(end, 'yyyy-MM-dd')

      const [eventsResponse, projectsResponse, clientsResponse] =
        await Promise.all([
          supabase
            .from('events')
            .select(
              `
              *,
              project:projects(name),
              client:wedding_clients(id, name, phone, email),
              event_assistants(
                assistant_id
              )
            `,
            )
            .gte('event_date', startDate)
            .lte('event_date', endDate)
            .order('event_date', { ascending: true }),
          supabase
            .from('projects')
            .select(
              `
              *,
              client:wedding_clients(id, name, phone, email)
            `,
            )
            .gte('event_date', startDate)
            .lte('event_date', endDate)
            .order('event_date', { ascending: true }),
          // Also include wedding_clients whose wedding_date falls in this
          // range but have NO event/project row linked — otherwise clients
          // created after the fact (historical records) never surface on
          // the calendar.
          supabase
            .from('wedding_clients')
            .select('id, name, full_name, phone, email, wedding_date')
            .gte('wedding_date', startDate)
            .lte('wedding_date', endDate)
            .order('wedding_date', { ascending: true }),
        ])

      if (eventsResponse.error) throw eventsResponse.error
      if (projectsResponse.error) throw projectsResponse.error
      if (clientsResponse.error) throw clientsResponse.error

      const events = (eventsResponse.data || []).map((event) => ({
        ...event,
        client: Array.isArray(event.client) ? event.client[0] : event.client,
        project: Array.isArray(event.project)
          ? event.project[0]
          : event.project,
        assistants:
          (event.event_assistants as { assistant_id: string }[])?.map((ea) => ({
            id: ea.assistant_id,
            name: '',
          })) || [],
        reminder_days:
          typeof event.reminder_days === 'string'
            ? JSON.parse(event.reminder_days)
            : event.reminder_days || [],
        latitude: event.latitude ? parseFloat(event.latitude) : null,
        longitude: event.longitude ? parseFloat(event.longitude) : null,
      }))

      const projectEvents = (projectsResponse.data || []).map((project) => ({
        id: project.id,
        title: project.name,
        description: project.notes || project.description,
        event_date: project.event_date,
        event_type: project.event_type || 'project',
        start_time: project.event_time || null,
        end_time: null,
        location: project.event_location || project.location,
        color: '#8b8b8b',
        client_id: project.client_id,
        project_id: project.id,
        client: Array.isArray(project.client) ? project.client[0] : project.client,
        project: { name: project.name },
        assistants: [],
        reminder_days: [],
        latitude: null,
        longitude: null,
      }))

      // Skip clients that already have an event or project linked. Dedupe
      // either by direct client_id match or by matching wedding_date to
      // event_date.
      const linkedClientIds = new Set<string>([
        ...(eventsResponse.data ?? [])
          .map((e) => e.client_id)
          .filter((id): id is string => !!id),
        ...(projectsResponse.data ?? [])
          .map((p) => p.client_id)
          .filter((id): id is string => !!id),
      ])

      const clientEvents = (clientsResponse.data || [])
        .filter((c) => c.wedding_date && !linkedClientIds.has(c.id))
        .map((c) => {
          const weddingDate = c.wedding_date
            ? c.wedding_date.slice(0, 10)
            : ''
          return {
            id: `client-${c.id}`,
            title: c.full_name ?? c.name ?? 'Cliente sem nome',
            description: null,
            event_date: weddingDate,
            event_type: 'wedding',
            start_time: null,
            end_time: null,
            location: null,
            color: '#c084a8',
            client_id: c.id,
            project_id: null,
            client: {
              id: c.id,
              name: c.full_name ?? c.name ?? '',
              phone: c.phone ?? undefined,
              email: c.email ?? undefined,
            },
            project: null,
            assistants: [],
            reminder_days: [],
            latitude: null,
            longitude: null,
          }
        })

      return [...events, ...projectEvents, ...clientEvents] as Event[]
    },
    staleTime: 1000 * 60 * 5,
  })
}
