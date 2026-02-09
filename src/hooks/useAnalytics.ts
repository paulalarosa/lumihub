import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService, AnalyticsEvent, ConversionEvent } from '@/services/analytics.service';
import { supabase } from '@/integrations/supabase/client';

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

  const fetchDashboardStats = useCallback(async () => {
    try {
      // 1. Get stored events (Local)
      const storedEvents = analyticsService.getStoredEvents();

      // 2. Get Real DB Stats
      const { data: clients, count: clientsCount } = await supabase
        .from('wedding_clients')
        .select('created_at, last_visit', { count: 'exact' });

      const { data: eventsData } = await supabase
        .from('events')
        .select('total_value, start_time, created_at')
        .not('total_value', 'is', null);

      const totalRevenue = eventsData?.reduce((acc, curr) => acc + (curr.total_value || 0), 0) || 0;
      const newLeads = clientsCount || 0;

      // Process Revenue Over Time (Last 6 months)
      const revenueByMonth = eventsData?.reduce((acc: Record<string, number>, curr) => {
        const date = new Date(curr.start_time || curr.created_at);
        const key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        acc[key] = (acc[key] || 0) + (curr.total_value || 0);
        return acc;
      }, {}) || {};

      const revenueChartData = Object.entries(revenueByMonth).map(([name, value]) => ({ name, value }));

      // Process Client Growth (Last 6 months)
      const clientsByMonth = clients?.reduce((acc: Record<string, number>, curr) => {
        const date = new Date(curr.created_at);
        const key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}) || {};

      const clientsChartData = Object.entries(clientsByMonth).map(([name, value]) => ({ name, value }));

      return {
        events: storedEvents,
        stats: {
          totalEvents: storedEvents.length,
          totalRevenue,
          newLeads,
          conversionRate: storedEvents.length > 0 ? (storedEvents.filter(e => e.type === 'conversion').length / storedEvents.length) * 100 : 0
        },
        charts: {
          revenue: revenueChartData,
          clients: clientsChartData
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return null;
    }
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
    fetchDashboardStats,
  };
}

// Componente HOC para tracking automático - Removido devido a limitações de JSX em arquivo .ts
// Use AnalyticsProvider ao invés de HOC
