import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL inválida'),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'VITE_SUPABASE_ANON_KEY obrigatória'),
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
})

type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const result = envSchema.safeParse(import.meta.env)

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    if (import.meta.env.DEV) {
      console.error(
        `[ENV] Variáveis de ambiente inválidas:\n${missing}\n\nVerifique seu arquivo .env`,
      )
    }

    return {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    } as Env
  }

  return result.data
}

export const env = validateEnv()
