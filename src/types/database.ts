/**
 * Database Types - Typed interfaces for all Supabase tables
 * Auto-generated from database schema
 */

// ============================================
// Clients Table
// ============================================

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Projects Table
// ============================================

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  status: ProjectStatus;
  deadline: string;
  budget: number;
  paid_amount: number;
  briefing?: Record<string, any>;
  contract_content?: string;
  contract_url?: string;
  created_at: string;
  updated_at: string;
  // Relationships (via joins)
  clients?: Client;
}

// ============================================
// Tasks Table
// ============================================

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string;
  created_at: string;
  updated_at: string;
  // Relationships (via joins)
  projects?: Project;
}

// ============================================
// Contract Signatures Table
// ============================================

export interface ContractSignature {
  id: string;
  project_id: string;
  signed_by: string;
  signed_at: string;
  ip_address?: string;
  signature_url?: string;
  created_at: string;
  // Relationships
  projects?: Project;
}

// ============================================
// User Roles Table
// ============================================

export type UserRole = 'user' | 'admin' | 'super_admin' | 'assistant';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// ============================================
// System Config Table (CMS)
// ============================================

export type ConfigValueType = 'string' | 'number' | 'boolean' | 'json';

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  type: ConfigValueType;
  description?: string;
  updated_at: string;
  updated_by?: string;
}

// ============================================
// Wallets Table (Financial)
// ============================================

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Transactions Table (Financial)
// ============================================

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionType = 'credit' | 'debit';

export interface Transaction {
  id: string;
  wallet_id: string;
  project_id?: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  wallets?: Wallet;
  projects?: Project;
}

// ============================================
// Split Rules Table (Financial)
// ============================================

export interface SplitRule {
  id: string;
  project_id: string;
  recipient_user_id: string;
  percentage: number;
  fixed_amount?: number;
  created_at: string;
  updated_at: string;
  // Relationships
  projects?: Project;
}

// ============================================
// Payouts Table (Financial)
// ============================================

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Payout {
  id: string;
  wallet_id: string;
  amount: number;
  status: PayoutStatus;
  bank_account?: string;
  payout_date?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  wallets?: Wallet;
}

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
// Enums for UI Display
// ============================================

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planejamento',
  in_progress: 'Em Progresso',
  on_hold: 'Pausado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
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

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  on_hold: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};
