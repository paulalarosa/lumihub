import { ReactNode } from 'react'
import {
  Client,
  Project,
  Event,
  Service,
  Service,
  EventFormData,
  ClientFormData,
  ProjectFormData,
} from './api.types'

export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

export interface WithLoadingProps {
  loading?: boolean
  loadingText?: string
}

export interface WithErrorProps {
  error?: Error | string | null
  onRetry?: () => void
}

export interface DialogProps extends BaseComponentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
}

export interface ConfirmDialogProps extends DialogProps {
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: 'default' | 'destructive'
}

export interface FormProps<T> extends BaseComponentProps {
  initialData?: Partial<T>
  onSubmit: (data: T) => void | Promise<void>
  onCancel?: () => void
  submitText?: string
  cancelText?: string
}

export interface EventFormProps extends FormProps<EventFormData> {
  clients?: Client[]
  projects?: Project[]
  services?: Service[]
}

export type ClientFormProps = FormProps<ClientFormData>

export interface ProjectFormProps extends FormProps<ProjectFormData> {
  clients?: Client[]
}

export interface ListProps<T>
  extends BaseComponentProps, WithLoadingProps, WithErrorProps {
  data: T[]
  emptyMessage?: string
  onItemClick?: (item: T) => void
}

export interface EventListProps extends ListProps<Event> {
  onEdit?: (event: Event) => void
  onDelete?: (event: Event) => void
}

export interface ClientListProps extends ListProps<Client> {
  onEdit?: (client: Client) => void
  onDelete?: (client: Client) => void
}

export interface ProjectListProps extends ListProps<Project> {
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
}

export interface CardProps extends BaseComponentProps {
  title?: string
  description?: string
  footer?: ReactNode
}

export interface EventCardProps extends CardProps {
  event: Event
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export interface ClientCardProps extends CardProps {
  client: Client
  onClick?: () => void
  showActions?: boolean
}

export interface ProjectCardProps extends CardProps {
  project: Project
  onClick?: () => void
  showProgress?: boolean
}

export interface DashboardWidgetProps extends BaseComponentProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

export interface ChartProps extends BaseComponentProps {
  data: Array<{ label: string; value: number }>
  type?: 'bar' | 'line' | 'pie'
  height?: number
}

export interface FilterProps<T> extends BaseComponentProps {
  filters: T
  onFiltersChange: (filters: T) => void
  onReset?: () => void
}

export interface PaginationProps extends BaseComponentProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  totalItems?: number
}

export interface SearchProps extends BaseComponentProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounce?: number
}

export interface LayoutProps extends BaseComponentProps {
  header?: ReactNode
  sidebar?: ReactNode
  footer?: ReactNode
}

export interface SidebarProps extends BaseComponentProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export interface AuthFormProps extends BaseComponentProps {
  onSuccess?: () => void
  redirectTo?: string
}

export interface LoginFormProps extends AuthFormProps {
  showRegisterLink?: boolean
}

export interface RegisterFormProps extends AuthFormProps {
  showLoginLink?: boolean
}

export interface InviteAssistantFormProps extends BaseComponentProps {
  onSuccess?: () => void
}

export interface AssistantDashboardProps extends BaseComponentProps {
  assistantId: string
}

export interface UpgradePageProps extends BaseComponentProps {
  currentPlan?: string
}

export interface CheckoutProps extends BaseComponentProps {
  planType: 'basic' | 'pro' | 'enterprise'
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export interface SettingsTabProps extends BaseComponentProps {
  onSave?: () => void
}

export type ProfileSettingsProps = SettingsTabProps
export type NotificationSettingsProps = SettingsTabProps
export type IntegrationSettingsProps = SettingsTabProps
