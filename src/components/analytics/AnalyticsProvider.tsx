import { useEffect, createContext, useContext, ReactNode } from 'react';
import { usePageTracking, useScrollTracking, useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsContextType {
  trackEvent: ReturnType<typeof useAnalytics>['trackEvent'];
  trackCTAClick: ReturnType<typeof useAnalytics>['trackCTAClick'];
  trackConversion: ReturnType<typeof useAnalytics>['trackConversion'];
  trackFormSubmit: ReturnType<typeof useAnalytics>['trackFormSubmit'];
  trackAuth: ReturnType<typeof useAnalytics>['trackAuth'];
  trackBooking: ReturnType<typeof useAnalytics>['trackBooking'];
  trackSubscription: ReturnType<typeof useAnalytics>['trackSubscription'];
  getSessionSummary: ReturnType<typeof useAnalytics>['getSessionSummary'];
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const analytics = useAnalytics();

  // Ativar tracking automático
  usePageTracking();
  useScrollTracking();

  // Track quando usuário sai da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Enviar último evento de tempo na página
      const summary = analytics.getSessionSummary();
      if (import.meta.env.DEV) {

      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [analytics]);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
}
