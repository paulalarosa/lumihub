const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

export interface EnvValidationResult {
  isValid: boolean
  missing: string[]
}

export function validateEnv(): EnvValidationResult {
  const missing: string[] = []

  for (const varName of requiredEnvVars) {
    if (!import.meta.env[varName]) {
      missing.push(varName)
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  }
}

export const env = {
  supabase: {
    url:
      (import.meta.env.VITE_SUPABASE_URL as string) ||
      (import.meta.env.MODE === 'test' ? 'http://localhost:54321' : ''),
    anonKey:
      (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
      (import.meta.env.MODE === 'test' ? 'dummy' : ''),
  },
  stripe: {
    publicKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string,
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}
