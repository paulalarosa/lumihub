// Component Props Types
// Centralized type definitions for React component props

import { ReactNode } from 'react';
import {
    Client,
    Project,
    Event,
    Service,
    Payment,
    EventFormData,
    ClientFormData,
    ProjectFormData,
} from './api.types';

// Common Props
export interface BaseComponentProps {
    className?: string;
    children?: ReactNode;
}

export interface WithLoadingProps {
    loading?: boolean;
    loadingText?: string;
}

export interface WithErrorProps {
    error?: Error | string | null;
    onRetry?: () => void;
}

// Dialog/Modal Props
export interface DialogProps extends BaseComponentProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
}

export interface ConfirmDialogProps extends DialogProps {
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    variant?: 'default' | 'destructive';
}

// Form Props
export interface FormProps<T> extends BaseComponentProps {
    initialData?: Partial<T>;
    onSubmit: (data: T) => void | Promise<void>;
    onCancel?: () => void;
    submitText?: string;
    cancelText?: string;
}

export interface EventFormProps extends FormProps<EventFormData> {
    clients?: Client[];
    projects?: Project[];
    services?: Service[];
}

export interface ClientFormProps extends FormProps<ClientFormData> { }

export interface ProjectFormProps extends FormProps<ProjectFormData> {
    clients?: Client[];
}

// List/Table Props
export interface ListProps<T> extends BaseComponentProps, WithLoadingProps, WithErrorProps {
    data: T[];
    emptyMessage?: string;
    onItemClick?: (item: T) => void;
}

export interface EventListProps extends ListProps<Event> {
    onEdit?: (event: Event) => void;
    onDelete?: (event: Event) => void;
}

export interface ClientListProps extends ListProps<Client> {
    onEdit?: (client: Client) => void;
    onDelete?: (client: Client) => void;
}

export interface ProjectListProps extends ListProps<Project> {
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

// Card Props
export interface CardProps extends BaseComponentProps {
    title?: string;
    description?: string;
    footer?: ReactNode;
}

export interface EventCardProps extends CardProps {
    event: Event;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export interface ClientCardProps extends CardProps {
    client: Client;
    onClick?: () => void;
    showActions?: boolean;
}

export interface ProjectCardProps extends CardProps {
    project: Project;
    onClick?: () => void;
    showProgress?: boolean;
}

// Dashboard Props
export interface DashboardWidgetProps extends BaseComponentProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
        value: number;
        direction: 'up' | 'down';
    };
}

export interface ChartProps extends BaseComponentProps {
    data: Array<{ label: string; value: number }>;
    type?: 'bar' | 'line' | 'pie';
    height?: number;
}

// Filter Props
export interface FilterProps<T> extends BaseComponentProps {
    filters: T;
    onFiltersChange: (filters: T) => void;
    onReset?: () => void;
}

// Pagination Props
export interface PaginationProps extends BaseComponentProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
    totalItems?: number;
}

// Search Props
export interface SearchProps extends BaseComponentProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounce?: number;
}

// Layout Props
export interface LayoutProps extends BaseComponentProps {
    header?: ReactNode;
    sidebar?: ReactNode;
    footer?: ReactNode;
}

export interface SidebarProps extends BaseComponentProps {
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
}

// Auth Props
export interface AuthFormProps extends BaseComponentProps {
    onSuccess?: () => void;
    redirectTo?: string;
}

export interface LoginFormProps extends AuthFormProps {
    showRegisterLink?: boolean;
}

export interface RegisterFormProps extends AuthFormProps {
    showLoginLink?: boolean;
}

// Assistant Props
export interface InviteAssistantFormProps extends BaseComponentProps {
    onSuccess?: () => void;
}

export interface AssistantDashboardProps extends BaseComponentProps {
    assistantId: string;
}

// Payment Props
export interface UpgradePageProps extends BaseComponentProps {
    currentPlan?: string;
}

export interface CheckoutProps extends BaseComponentProps {
    planType: 'basic' | 'pro' | 'enterprise';
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

// Settings Props
export interface SettingsTabProps extends BaseComponentProps {
    onSave?: () => void;
}

export interface ProfileSettingsProps extends SettingsTabProps { }
export interface NotificationSettingsProps extends SettingsTabProps { }
export interface IntegrationSettingsProps extends SettingsTabProps { }
