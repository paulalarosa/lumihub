import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey
);

interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
}

export const handleSupabaseError = (error: SupabaseError | Error | unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as SupabaseError).message || "Ocorreu um erro inesperado no banco de dados.";
  }
  return "Ocorreu um erro inesperado no banco de dados.";
};