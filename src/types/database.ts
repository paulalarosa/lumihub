import { Database } from '@/integrations/supabase/types'

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ProjectStatus =
  | 'lead'
  | 'briefing'
  | 'contract'
  | 'paid'
  | 'completed'
  | 'cancelled'
export type KanbanCategory = 'todo' | 'in_progress' | 'done'

export type Project = Tables<'projects'>
export type Service = Tables<'services'>

export interface Microsite {
  id: string
  slug: string
  business_name: string
  tagline: string | null
  bio: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  instagram_handle: string | null
  show_prices: boolean
  enable_booking: boolean
  enable_gallery: boolean
  enable_services: boolean
  enable_about: boolean
  enable_contact: boolean
  enable_reviews: boolean
  is_published: boolean
  view_count: number
  user_id?: string
  makeup_artist_id?: string
}

export interface Task extends Tables<'tasks'> {
  status: TaskStatus | null
  priority: TaskPriority | null
}

export interface KanbanTask extends Task {
  status: TaskStatus
  priority: TaskPriority
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Pendente',
  in_progress: 'Em Andamento',
  review: 'Em Revisão',
  done: 'Concluído',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}
