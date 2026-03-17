import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { env } from '@/config/env'

const supabaseUrl = env.supabase.url
const supabaseKey = env.supabase.anonKey

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase credentials are missing. Check your environment variables.',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

interface SupabaseError {
  message?: string
  code?: string
  details?: string
}

export const handleSupabaseError = (
  error: SupabaseError | Error | unknown,
): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (
      (error as SupabaseError).message ||
      'Ocorreu um erro inesperado no banco de dados.'
    )
  }
  return 'Ocorreu um erro inesperado no banco de dados.'
}
