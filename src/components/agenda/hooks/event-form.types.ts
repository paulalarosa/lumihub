export interface EventFormData {
  id?: string
  title: string
  description: string | null
  event_date: string
  event_type: string | null
  start_time: string | null
  end_time: string | null
  arrival_time: string | null
  making_of_time: string | null
  ceremony_time: string | null
  advisory_time: string | null
  address: string | null
  latitude: string | null
  longitude: string | null
  notes: string | null
  color: string
  client_id: string | null
  project_id: string | null
  reminder_days: number[]
  assistants?: { id: string; name: string }[]
  google_calendar_event_id?: string | null
}

export interface EventClient {
  id: string
  name: string
  phone: string | null
}

export interface EventProject {
  id: string
  name: string
  client_id: string
}

export interface EventService {
  id: string
  name: string
  price: number
  duration_minutes: number
  description: string | null
}

export interface EventAssistant {
  id: string
  name: string
  email: string | null
  phone: string | null
}
