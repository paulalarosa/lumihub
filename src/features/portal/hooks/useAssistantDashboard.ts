import { useMemo } from 'react'
import { parseISO } from 'date-fns/parseISO'
import { isToday } from 'date-fns/isToday'
import { isTomorrow } from 'date-fns/isTomorrow'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface Event {
  id: string
  title: string
  event_date: string
  start_time: string | null
  location: string | null
  event_type: string | null
  clients?: { name: string } | null
}

export interface Task {
  id: string
  title: string
  due_date: string | null
  is_completed: boolean
  projects?: { name: string } | null
}

export function useAssistantEarnings(assistantId?: string) {
  return useQuery({
    queryKey: ['assistant-earnings-metrics', assistantId],
    queryFn: async () => {
      if (!assistantId) return null
      const { data: assignments, error } = await supabase
        .from('event_assistants')
        .select(
          `
          events (
            assistant_commission,
            start_time
          )
        `,
        )
        .eq('assistant_id', assistantId)

      if (error) throw error

      let thisMonth = 0
      let lastMonth = 0
      let totalEarned = 0
      let eventsCompleted = 0

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      assignments?.forEach((assignment) => {
        const e = assignment.events
        const comm = Number(e?.assistant_commission) || 0
        const startTime = e?.start_time ? new Date(e.start_time) : null

        totalEarned += comm
        if (startTime) {
          eventsCompleted += 1
          const month = startTime.getMonth()
          const year = startTime.getFullYear()
          if (year === currentYear && month === currentMonth) {
            thisMonth += comm
          } else if (
            (month === currentMonth - 1 && year === currentYear) ||
            (currentMonth === 0 && month === 11 && year === currentYear - 1)
          ) {
            lastMonth += comm
          }
        }
      })

      return {
        thisMonth,
        lastMonth,
        totalEarned,
        commissionRate: 15,
        eventsCompleted,
        targetThisMonth: 4000.0,
        nextMilestone: 18000.0,
      }
    },
    enabled: !!assistantId,
  })
}

export function useAssistantDashboard(
  events: Event[],
  tasks: Task[],
  assistantId?: string,
) {
  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => {
        const eventDate = parseISO(e.event_date)
        return isToday(eventDate) || isTomorrow(eventDate)
      })
      .slice(0, 3)
  }, [events])

  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => !t.is_completed).slice(0, 5)
  }, [tasks])

  const monthEvents = events.length

  const { data: earningsDataDb } = useAssistantEarnings(assistantId)

  const earningsData = earningsDataDb || {
    thisMonth: 2850.0,
    lastMonth: 2200.0,
    totalEarned: 15250.0,
    commissionRate: 15,
    eventsCompleted: 8,
    targetThisMonth: 4000.0,
    nextMilestone: 18000.0,
  }

  const progressToTarget =
    earningsData.targetThisMonth > 0
      ? (earningsData.thisMonth / earningsData.targetThisMonth) * 100
      : 0
  const progressToMilestone =
    earningsData.nextMilestone > 0
      ? (earningsData.totalEarned / earningsData.nextMilestone) * 100
      : 0
  const missingToMilestone =
    earningsData.nextMilestone - earningsData.totalEarned
  const monthGrowth =
    earningsData.lastMonth > 0
      ? ((earningsData.thisMonth - earningsData.lastMonth) /
          earningsData.lastMonth) *
        100
      : 0

  return {
    upcomingEvents,
    pendingTasks,
    monthEvents,
    earningsData,
    progressToTarget,
    progressToMilestone,
    missingToMilestone,
    monthGrowth,
  }
}
