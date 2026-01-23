import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseKey || ''
);

// Função essencial para evitar o erro de importação no useSubscription.ts
export const handleSupabaseError = (error: any) => {
  console.error("Erro no Supabase:", error);
  return error.message || "Ocorreu um erro inesperado no banco de dados.";
};