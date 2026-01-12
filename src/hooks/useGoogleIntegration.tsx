import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UseGoogleIntegrationReturn {
  hasActiveIntegration: boolean;
  isLoading: boolean;
  error: Error | null;
  refreshIntegration: () => Promise<void>;
}

export function useGoogleIntegration(): UseGoogleIntegrationReturn {
  const { user } = useAuth();
  const [hasActiveIntegration, setHasActiveIntegration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkIntegration = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('user_integrations')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .eq('is_active', true)
        .maybeSingle();

      if (queryError) {
        throw queryError;
      }

      setHasActiveIntegration(!!data);
    } catch (err) {
      console.error('Error checking Google integration:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setHasActiveIntegration(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkIntegration();
  }, [user]);

  const refreshIntegration = async () => {
    await checkIntegration();
  };

  return {
    hasActiveIntegration,
    isLoading,
    error,
    refreshIntegration,
  };
}
