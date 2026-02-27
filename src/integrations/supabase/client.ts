import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { env } from '@/lib/env'

const FALLBACK_URL = 'https://pymdkngcpbmcnayxieod.supabase.co'
const FALLBACK_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bWRrbmdjcGJtY25heXhpZW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzA3NTcsImV4cCI6MjA4MzU0Njc1N30.XJ9D0EpjkhCR6u74aIywb1MlmFDJPOktomudBL5iszE'

const supabaseUrl = env.VITE_SUPABASE_URL || FALLBACK_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY

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
