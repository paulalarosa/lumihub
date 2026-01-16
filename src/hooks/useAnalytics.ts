import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService, AnalyticsEvent, ConversionEvent } from '@/services/analytics.service';

// Hook para tracking automático de page views e tempo na página
export function usePageTracking() {
  const location = useLocation();
  const prevPathRef = useRef<string>('');

  useEffect(() => {
    // Track page view quando a rota muda
    if (prevPathRef.current !== location.pathname) {
      // Track time on previous page if exists
      if (prevPathRef.current) {
        analyticsService.trackTimeOnPage(prevPathRef.current);
      }

      // Track new page view
      analyticsService.trackPageView({
        page_path: location.pathname,
        page_title: document.title,
        page_location: window.location.href,
      });

      prevPathRef.current = location.pathname;
    }

    // Track time on page when user leaves
    return () => {
      analyticsService.trackTimeOnPage(location.pathname);
    };
  }, [location.pathname]);
}

// Hook para tracking de scroll depth
export function useScrollTracking() {
  const location = useLocation();
  const trackedDepthsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Reset tracked depths on page change
    trackedDepthsRef.current.clear();

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      const scrollPercentage = Math.round((scrollTop / scrollHeight) * 100);

      const thresholds = [25, 50, 75, 100];
      
      thresholds.forEach(threshold => {
        if (scrollPercentage >= threshold && !trackedDepthsRef.current.has(threshold)) {
          trackedDepthsRef.current.add(threshold);
          analyticsService.trackScrollDepth(threshold, location.pathname);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);
}

// Hook principal para tracking de eventos
export function useAnalytics() {
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    analyticsService.trackEvent(event);
  }, []);

  const trackCTAClick = useCallback((ctaName: string, location: string, destination?: string) => {
    analyticsService.trackCTAClick(ctaName, location, destination);
  }, []);

  const trackConversion = useCallback((conversion: ConversionEvent) => {
    analyticsService.trackConversion(conversion);
  }, []);

  const trackFormSubmit = useCallback((formName: string, success: boolean, errorMessage?: string) => {
    analyticsService.trackFormSubmit(formName, success, errorMessage);
  }, []);

  const trackAuth = useCallback((action: 'login' | 'signup' | 'logout' | 'password_reset', method?: string) => {
    analyticsService.trackAuth(action, method);
  }, []);

  const trackBooking = useCallback((action: 'started' | 'completed' | 'cancelled', serviceId?: string, value?: number) => {
    analyticsService.trackBooking(action, serviceId, value);
  }, []);

  const trackSubscription = useCallback((action: 'view_plans' | 'select_plan' | 'start_trial' | 'subscribe' | 'cancel', planName?: string, value?: number) => {
    analyticsService.trackSubscription(action, planName, value);
  }, []);

  const getSessionSummary = useCallback(() => {
    return analyticsService.getSessionSummary();
  }, []);

  return {
    trackEvent,
    trackCTAClick,
    trackConversion,
    trackFormSubmit,
    trackAuth,
    trackBooking,
    trackSubscription,
    getSessionSummary,
  };
}

// Componente HOC para tracking automático - Removido devido a limitações de JSX em arquivo .ts
// Use AnalyticsProvider ao invés de HOC
