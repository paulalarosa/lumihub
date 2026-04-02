export const productionConfig = {
  endpoints: {
    api: import.meta.env.VITE_API_URL || 'https://api.khaoskontrol.com.br/v1',
    site: 'https://khaoskontrol.com.br',
  },
  features: {
    analytics: true,
    debug: false,
  },
}
