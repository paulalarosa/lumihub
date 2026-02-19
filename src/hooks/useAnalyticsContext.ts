
import { useContext } from 'react';
import { AnalyticsContext } from '@/contexts/AnalyticsContext';

export function useAnalyticsContext() {
    const context = useContext(AnalyticsContext);
    if (!context) {
        throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
    }
    return context;
}
