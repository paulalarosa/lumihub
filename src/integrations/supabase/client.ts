import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Fallback to placeholder to prevent build errors when env vars are missing.
// This is critical for the build process to succeed even if secrets aren't available.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pymdkngcpbmcnayxieod.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bWRrbmdjcGJtY25heXhpZW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzA3NTcsImV4cCI6MjA4MzU0Njc1N30.XJ9D0EpjkhCR6u74aIywb1MlmFDJPOktomudBL5iszE';

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