import { useEffect, ReactNode } from 'react';
import { usePageTracking, useScrollTracking, useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsContext } from '@/contexts/AnalyticsContext';

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
      // No-op for now
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
