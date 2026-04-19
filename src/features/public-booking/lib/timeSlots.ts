import { addMinutes } from 'date-fns/addMinutes'
import { isBefore } from 'date-fns/isBefore'
import { startOfDay } from 'date-fns/startOfDay'
import { parse } from 'date-fns/parse'
import type { TimeSlot } from '../types'
import type { DayEvent } from '../api/publicBookingApi'

const DEFAULT_START_HOUR = 9
const DEFAULT_END_HOUR = 18
const SLOT_STEP_MINUTES = 30

export interface TimeSlotOptions {
  date: Date
  serviceDurationMinutes: number
  dayEvents: DayEvent[]
  now?: Date
  startHour?: number
  endHour?: number
}

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  eventStart: Date,
  eventEnd: Date,
): boolean {
  return (
    (slotStart >= eventStart && slotStart < eventEnd) ||
    (slotEnd > eventStart && slotEnd <= eventEnd) ||
    (slotStart <= eventStart && slotEnd >= eventEnd)
  )
}

export function buildTimeSlots({
  date,
  serviceDurationMinutes,
  dayEvents,
  now = new Date(),
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
}: TimeSlotOptions): TimeSlot[] {
  const slots: TimeSlot[] = []
  const isPastDay = isBefore(date, startOfDay(now))

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += SLOT_STEP_MINUTES) {
      const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      const slotStart = parse(time, 'HH:mm', date)
      const slotEnd = addMinutes(slotStart, serviceDurationMinutes)

      let blocked = false

      for (const event of dayEvents) {
        const eventStart = parse(event.start_time, 'HH:mm', date)
        const eventEnd = event.end_time
          ? parse(event.end_time, 'HH:mm', date)
          : addMinutes(eventStart, event.duration_minutes ?? 60)

        if (overlaps(slotStart, slotEnd, eventStart, eventEnd)) {
          blocked = true
          break
        }
      }

      if (!blocked && (isPastDay || isBefore(slotStart, now))) {
        blocked = true
      }

      slots.push({ time, available: !blocked })
    }
  }

  return slots
}
