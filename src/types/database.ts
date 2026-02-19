/**
 * Database Types - Re-exports and helpers based on Supabase auto-generated types
 * The source of truth is src/types/supabase.ts
 */

import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

// ============================================
// Type Aliases from Supabase Tables
// ============================================

export type Client = Tables<'wedding_clients'>;
export type ClientInsert = TablesInsert<'wedding_clients'>;
export type ClientUpdate = TablesUpdate<'wedding_clients'>;

export type Project = Tables<'projects'>;
export type ProjectInsert = TablesInsert<'projects'>;
export type ProjectUpdate = TablesUpdate<'projects'>;

export type Task = Tables<'tasks'>;
export type TaskInsert = TablesInsert<'tasks'>;
export type TaskUpdate = TablesUpdate<'tasks'>;

export type Contract = Tables<'contracts'>;
export type ContractInsert = TablesInsert<'contracts'>;
export type ContractUpdate = TablesUpdate<'contracts'>;

export type Event = Tables<'events'>;
export type EventInsert = TablesInsert<'events'>;
export type EventUpdate = TablesUpdate<'events'>;

export type Assistant = Tables<'assistants'>;
export type AssistantInsert = TablesInsert<'assistants'>;
export type AssistantUpdate = TablesUpdate<'assistants'>;

export type Invoice = Tables<'invoices'>;
export type InvoiceInsert = TablesInsert<'invoices'>;
export type InvoiceUpdate = TablesUpdate<'invoices'>;

export type Service = Tables<'services'>;
export type ServiceInsert = TablesInsert<'services'>;
export type ServiceUpdate = TablesUpdate<'services'>;

export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

// ============================================
// Project Status Type (based on actual DB values)
// ============================================

export type ProjectStatus = 'active' | 'completed' | 'cancelled' | 'planning' | 'in_progress' | 'on_hold';

// ============================================
// Task Types for Kanban (UI-only, not in DB)
// ============================================

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

// Extended task type for Kanban UI (adds virtual fields)
export interface KanbanTask extends Task {
  status: TaskStatus;
  priority: TaskPriority;
}

// ============================================
// User Roles (from DB enum)
// ============================================

export type UserRole = 'admin' | 'user';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
}

// ============================================
// Financial Types (manual tables)
// ============================================

export interface Wallet {
  id: string;
  user_id: string;
  available_balance: number;
  pending_balance: number;
  bank_details?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'canceled' | 'refunded';
export type TransactionType = 'charge' | 'refund' | 'payout' | 'adjustment';

export interface Transaction {
  id: string;
  user_id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface FinancialOverview {
  user_id: string;
  period_start: string;
  period_type: 'monthly' | 'annual';
  gross_revenue: number;
  platform_fees: number;
  net_revenue: number;
  transactions_count: number;
}

// ============================================
// Config Types
// ============================================

export type ConfigValueType = 'string' | 'number' | 'boolean' | 'json';

export interface ConfigItem {
  id: string;
  key: string;
  value: string | null;
  type: ConfigValueType;
  description?: string;
  updated_at: string;
  updated_by?: string;
}

// ============================================
// UI Display Labels & Colors
// ============================================

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Ativo',
  planning: 'Planejamento',
  in_progress: 'Em Progresso',
  on_hold: 'Pausado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  planning: 'bg-purple-100 text-purple-700 border-purple-200',
  in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  on_hold: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  review: 'Revisão',
  done: 'Concluído',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

// ============================================
// Common Query Response Types
// ============================================

export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
}

export interface QueryResponse<T> {
  data: T | null;
  error: DatabaseError | null;
}

export interface QueryManyResponse<T> {
  data: T[];
  error: DatabaseError | null;
  count?: number;
}

// ============================================
// Project with Client (for joins)
// ============================================

export interface ProjectWithClient extends Project {
  clients?: Client | null;
}
