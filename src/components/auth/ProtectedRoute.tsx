import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

const ProtectedRoute = ({ children, requireOnboarding = true }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { status, isLoading: subLoading } = useSubscription();

  const navigate = useNavigate();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    if (requireOnboarding) {
      checkOnboardingStatus();
    } else {
      setCheckingOnboarding(false);
    }
  }, [user, authLoading, requireOnboarding]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking onboarding status:', error);
        setOnboardingCompleted(true); // Assume completed on error to prevent blocking
      } else {
        setOnboardingCompleted(data?.onboarding_completed ?? false);
      }
    } catch (err) {
      console.error('Onboarding check error:', err);
      setOnboardingCompleted(true);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  // Handle redirects based on onboarding status
  useEffect(() => {
    if (checkingOnboarding || onboardingCompleted === null) return;
    if (!user) return; // Auth handling is done by other logic usually, or we redirect to auth

    if (location.pathname === '/planos') return; // Don't redirect if already on plans logic


    const isOnboardingPage = location.pathname === '/onboarding';

    // User has COMPLETED onboarding but is trying to access onboarding page
    // Redirect them to dashboard
    if (onboardingCompleted && isOnboardingPage) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // User has NOT completed onboarding and is NOT on onboarding page
    // Redirect them to onboarding (if required)
    if (!onboardingCompleted && !isOnboardingPage && requireOnboarding) {
      navigate('/onboarding', { replace: true });
      return;
    }
  }, [checkingOnboarding, onboardingCompleted, location.pathname, user, requireOnboarding]);

  useEffect(() => {
    if (authLoading || checkingOnboarding || subLoading) return;
    if (!user) return;
    if (!onboardingCompleted && requireOnboarding) return; // Prioritize onboarding

    // If expired and not on plans/profile/billing pages
    if (status === 'expired' && location.pathname !== '/planos' && location.pathname !== '/configuracoes') {
      navigate('/planos');
    }
  }, [status, subLoading, location.pathname, user, onboardingCompleted, authLoading, checkingOnboarding]);

  if (authLoading || (requireOnboarding && checkingOnboarding) || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Allow rendering if:
  // 1. On onboarding page and onboarding not completed
  // 2. Not on onboarding page and onboarding completed
  // 3. requireOnboarding is false
  const isOnboardingPage = location.pathname === '/onboarding';

  if (!requireOnboarding) {
    return <>{children}</>;
  }

  if (isOnboardingPage && !onboardingCompleted) {
    return <>{children}</>;
  }

  if (!isOnboardingPage && onboardingCompleted) {
    return <>{children}</>;
  }

  // Waiting for redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <Loader2 className="h-8 w-8 animate-spin text-white/60" />
    </div>
  );
};

export default ProtectedRoute;
