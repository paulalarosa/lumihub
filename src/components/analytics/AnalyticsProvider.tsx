import { useEffect, ReactNode } from 'react'
import {
  usePageTracking,
  useScrollTracking,
  useAnalytics,
} from '@/hooks/useAnalytics'
import { AnalyticsContext } from '@/contexts/AnalyticsContext'

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const analytics = useAnalytics()

  usePageTracking()
  useScrollTracking()

  useEffect(() => {
    const handleBeforeUnload = () => {
      const _summary = analytics.getSessionSummary()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [analytics])

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  )
}
