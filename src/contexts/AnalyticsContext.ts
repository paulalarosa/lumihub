
import { createContext } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export interface AnalyticsContextType {
    trackEvent: ReturnType<typeof useAnalytics>['trackEvent'];
    trackCTAClick: ReturnType<typeof useAnalytics>['trackCTAClick'];
    trackConversion: ReturnType<typeof useAnalytics>['trackConversion'];
    trackFormSubmit: ReturnType<typeof useAnalytics>['trackFormSubmit'];
    trackAuth: ReturnType<typeof useAnalytics>['trackAuth'];
    trackBooking: ReturnType<typeof useAnalytics>['trackBooking'];
    trackSubscription: ReturnType<typeof useAnalytics>['trackSubscription'];
    getSessionSummary: ReturnType<typeof useAnalytics>['getSessionSummary'];
}

export const AnalyticsContext = createContext<AnalyticsContextType | null>(null);
