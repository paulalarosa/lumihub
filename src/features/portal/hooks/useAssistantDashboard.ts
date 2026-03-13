import { useMemo } from 'react'
import { parseISO } from 'date-fns/parseISO'
import { isToday } from 'date-fns/isToday'
import { isTomorrow } from 'date-fns/isTomorrow'

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

export function useAssistantDashboard(events: Event[], tasks: Task[]) {
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

  // Mock earnings data - in production this would come from the backend or filtered props
  const earningsData = {
    thisMonth: 2850.0,
    lastMonth: 2200.0,
    totalEarned: 15250.0,
    commissionRate: 15,
    eventsCompleted: 8,
    targetThisMonth: 4000.0,
    nextMilestone: 18000.0,
  }

  const progressToTarget =
    (earningsData.thisMonth / earningsData.targetThisMonth) * 100
  const progressToMilestone =
    (earningsData.totalEarned / earningsData.nextMilestone) * 100
  const missingToMilestone =
    earningsData.nextMilestone - earningsData.totalEarned
  const monthGrowth =
    ((earningsData.thisMonth - earningsData.lastMonth) /
      earningsData.lastMonth) *
    100

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
