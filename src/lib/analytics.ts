import ReactGA from 'react-ga4'

export const initAnalytics = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

  if (measurementId && import.meta.env.PROD) {
    ReactGA.initialize(measurementId)
  }
}

export const trackPageView = (path: string) => {
  if (import.meta.env.PROD) {
    ReactGA.send({ hitType: 'pageview', page: path })
  }
}

export const trackEvent = (
  category: string,
  action: string,
  label?: string,
) => {
  if (import.meta.env.PROD) {
    ReactGA.event({
      category,
      action,
      label,
    })
  }
}

export const analytics = {
  viewPricing: () =>
    trackEvent('Neural_Billing', 'Manifest_View', 'Pricing_Grid'),
  clickUpgrade: (plan: string) =>
    trackEvent('Neural_Billing', 'Commit_Request', plan),
  completeCheckout: (plan: string, value: number) => {
    ReactGA.event('purchase', {
      transaction_id: crypto.randomUUID(),
      value,
      currency: 'BRL',
      items: [{ item_name: plan }],
    })
  },

  openAIChat: () => trackEvent('AI_Core', 'Interface_Active'),
  sendAIMessage: () => trackEvent('AI_Core', 'Neural_Packet_Sent'),
  createCanvas: () => trackEvent('AI_Core', 'Artifact_Generated'),
  enableLocalAI: () => trackEvent('AI_Core', 'Edge_Inference_Boot'),

  createEvent: (type: string) =>
    trackEvent('Execution', 'Process_Logged', type),
  createClient: () => trackEvent('Data_Vault', 'Entity_Registered'),
  generateContract: () => trackEvent('Data_Vault', 'Contract_Serialized'),

  connectGoogleCalendar: () =>
    trackEvent('External_Link', 'Neural_Sync_Google'),
}
