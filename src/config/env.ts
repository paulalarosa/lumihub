/**
 * Validação de variáveis de ambiente
 * Garante que todas as keys necessárias estão presentes
 */

const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

export function validateEnv() {
  const missing: string[] = []

  for (const varName of requiredEnvVars) {
    if (!import.meta.env[varName]) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}`,
    )
  }
}

// Tipos seguros para env vars
export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  },
  stripe: {
    publicKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string,
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}
