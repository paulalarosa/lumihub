// API Response Types
// Centralized type definitions for API responses and external data

import { Database } from '@/integrations/supabase/types'

// Supabase Table Types (shortcuts)
// Supabase Table Types (shortcuts)
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['wedding_clients']['Row'] // Table is wedding_clients
export type Project = Database['public']['Tables']['projects']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Service = Database['public']['Tables']['services']['Row']
// export type Payment = Database['public']['Tables']['payments']['Row']; // Table missing in types
// export type Subscription = Database['public']['Tables']['subscriptions']['Row']; // Table missing in types
export type Assistant = Database['public']['Tables']['assistants']['Row']
export type AssistantInvite =
  Database['public']['Tables']['assistant_invites']['Row']
export type NotificationLog =
  Database['public']['Tables']['notification_logs']['Row']
export type Contract = Database['public']['Tables']['contracts']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type ProjectService =
  Database['public']['Tables']['project_services']['Row']
export type Briefing = Database['public']['Tables']['briefings']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']

// Domain Types previously in database.ts
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

export interface KanbanTask extends Omit<Task, 'status' | 'priority'> {
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

// Insert Types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ClientInsert =
  Database['public']['Tables']['wedding_clients']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
// export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
// export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];

// Update Types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ClientUpdate =
  Database['public']['Tables']['wedding_clients']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type EventUpdate = Database['public']['Tables']['events']['Update']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']

// Extended Types with Relations
export interface ProjectWithRelations extends Project {
  client?: Client & {
    full_name?: string
    wedding_date?: string
    email?: string
    phone?: string
  }
  // Relations attached to the project object itself (if any)
  events?: Event[]
}

export interface ProjectDetailsResponse {
  project: ProjectWithRelations
  tasks: Task[]
  briefing: BriefingUI | null
  services: ServiceUI[]
  projectServices: ProjectServiceItem[]
  contracts: Contract[]
  transactions: Transaction[]
  invoices: unknown[]
}

export interface BriefingContent {
  questions?: unknown[]
  answers?: Record<string, unknown>
}

export interface BriefingWithContent extends Omit<Briefing, 'content'> {
  content?: BriefingContent | null
  questions?: unknown[] // Legacy support
  answers?: Record<string, unknown> // Legacy support
}

export interface EventWithRelations extends Event {
  project?: Project
  client?: Client
  services?: Service[]
}

export interface ServiceUI extends Omit<
  Service,
  'price' | 'duration_minutes' | 'base_price'
> {
  price: number
  duration_minutes: number
  base_price: number
}

export type ProjectServiceItem = Omit<
  ProjectService,
  'quantity' | 'total_price' | 'unit_price'
> & {
  quantity: number // Cast from string in DB
  total_price: number
  unit_price: number
  paid_amount?: number // UI specific / potentially calculated
  notes?: string | null // UI specific
  service?: ServiceUI
}

export type BriefingUI = BriefingWithContent & {
  is_submitted: boolean
}

export interface ClientWithRelations extends Client {
  projects?: Project[]
  events?: Event[]
}

// API Response Wrappers
export interface ApiResponse<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Form Data Types
export interface EventFormData {
  title: string
  description?: string
  event_date: string
  start_time?: string
  end_time?: string
  location?: string
  client_id?: string
  project_id?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  services?: string[]
}

export interface ClientFormData {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  birth_date?: string
  notes?: string
}

export interface ProjectFormData {
  name: string
  description?: string
  client_id: string
  event_date?: string
  budget?: number
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled'
}

// Filter Types
export interface EventFilters {
  status?: string
  client_id?: string
  project_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface ClientFilters {
  search?: string
  has_projects?: boolean
  created_after?: string
}

// Mercado Pago Types - REMOVED
// export interface MercadoPagoPreference { ... }
// export interface MercadoPagoPayment { ... }

// Resend Types
export interface ResendEmailRequest {
  to: string
  makeup_artist_name: string
  invite_link: string
  invite_id: string
}

export interface ResendEmailResponse {
  success: boolean
  email_id?: string
  error?: string
}

// Chart/Analytics Types
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface FinancialSummary {
  total: number
  received: number
  pending: number
  currency: string
}

export interface DashboardStats {
  total_clients: number
  total_projects: number
  upcoming_events: number
  financial_summary: FinancialSummary
}
