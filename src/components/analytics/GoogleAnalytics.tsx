import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const GA_MEASUREMENT_ID = 'G-C24BXN2S6H'

export const GoogleAnalytics = () => {
  const location = useLocation()

  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      })
    }
  }, [location])

  return null
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}
