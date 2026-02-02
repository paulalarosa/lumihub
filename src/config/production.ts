export const productionConfig = {
    endpoints: {
        api: import.meta.env.VITE_API_URL || 'https://api.khaoskontrol.com.br/v1', // Placeholder or Env var
        site: 'https://khaoskontrol.com.br'
    },
    features: {
        analytics: true,
        debug: false
    }
};
