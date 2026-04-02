export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  },
  app: {
    mode: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  },
}

const requiredKeys = [
  { key: env.supabase.url, name: 'VITE_SUPABASE_URL' },
  { key: env.supabase.anonKey, name: 'VITE_SUPABASE_ANON_KEY' },
]

requiredKeys.forEach(({ key, name }) => {
  if (!key) {
    if (env.app.isProd) {
      throw new Error(`Missing critical environment variable: ${name}`)
    }
  }
})
