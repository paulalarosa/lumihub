export const productionConfig = {
    endpoints: {
        api: import.meta.env.VITE_API_URL || 'https://api.lumihub.com/v1', // Placeholder or Env var
        site: 'https://lumihub.com'
    },
    features: {
        analytics: true,
        debug: false
    }
};
