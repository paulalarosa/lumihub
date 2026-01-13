import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

const ProtectedRoute = ({ children, requireOnboarding = true }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
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
    if (!user) return;

    const isOnboardingPage = location.pathname === '/onboarding';

    // User hasn't completed onboarding and is not on onboarding page
    if (!onboardingCompleted && !isOnboardingPage && requireOnboarding) {
      navigate('/onboarding', { replace: true });
      return;
    }

    // User has completed onboarding but is trying to access onboarding page
    if (onboardingCompleted && isOnboardingPage) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [checkingOnboarding, onboardingCompleted, location.pathname, user, requireOnboarding]);

  if (authLoading || (requireOnboarding && checkingOnboarding)) {
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
