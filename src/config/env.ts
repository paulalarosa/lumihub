const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

export interface EnvValidationResult {
  isValid: boolean
  missing: string[]
}

export function validateEnv(): EnvValidationResult {
  const missing: string[] = []

  for (const varName of requiredEnvVars) {
    const val = import.meta.env[varName] as string | undefined
    if (!val || val === 'undefined' || val === 'null') {
      missing.push(varName)
    }
  }

  // Validação avançada para prevenir "Invalid API Key" por mix de chaves de dev/prod
  const url = (import.meta.env.VITE_SUPABASE_URL as string || '').trim().replace(/^["']|["']$/g, '')
  const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim()
  const key = rawKey.replace(/^["']|["']$/g, '')

  if (url && key && import.meta.env.MODE !== 'test' && key !== 'mock-key' && key !== 'dummy') {
    try {
      const parts = key.split('.')
      if (parts.length === 3) {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        while (base64.length % 4 !== 0) {
          base64 += '='
        }
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        )
        const payload = JSON.parse(jsonPayload)

        const urlMatch = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i)
        
        if (urlMatch && payload.ref) {
          const expectedRef = urlMatch[1]
          if (expectedRef !== payload.ref) {
            missing.push(`VITE_SUPABASE_ANON_KEY (Misto de Ambientes! A URL é do projeto '${expectedRef}', mas a chave pertence ao projeto '${payload.ref}'. Verifique seu .env ou secrets do pipeline.)`)
          }
        }
      } else {
        missing.push(`VITE_SUPABASE_ANON_KEY (Formato JWT Inválido. A chave deve ter 3 partes separadas por pontos. Encontradas: ${parts.length}. Valor: "${key.substring(0, 15)}...")`)
      }
    } catch (e) {
      missing.push(`VITE_SUPABASE_ANON_KEY (Erro na decodificação do JWT: ${e instanceof Error ? e.message : 'Chave inválida'})`)
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
