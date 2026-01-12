import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleIntegration } from '@/hooks/useGoogleIntegration';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireGoogleIntegration?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireGoogleIntegration = false 
}: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { hasActiveIntegration, isLoading: integrationLoading } = useGoogleIntegration();

  // Loading state
  if (authLoading || (requireGoogleIntegration && integrationLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Authenticated but needs Google integration
  if (requireGoogleIntegration && !hasActiveIntegration) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
