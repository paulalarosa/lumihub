import { Database } from './supabase';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export type Microsite = Tables<'microsites'>;
export type Appointment = Tables<'appointments'>;
export type WeddingClient = Tables<'wedding_clients'>;
export type Profile = Tables<'profiles'>;
export type Project = Tables<'projects'>;
export type Contract = Tables<'contracts'>;
export type Service = Tables<'services'>;
export type Assistant = Tables<'assistants'>;
export type Invoice = Tables<'invoices'>;
export type CalendarEvent = Tables<'calendar_events'>;
export type Task = Tables<'tasks'>;
export type UserRole = Enums<'user_role'>;
