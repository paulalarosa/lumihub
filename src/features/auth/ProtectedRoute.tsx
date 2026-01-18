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
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    // Always check status to get role, even if requireOnboarding is false
    checkOnboardingStatus();
  }, [user, authLoading]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking onboarding status:', error);
        setOnboardingCompleted(true); // Fail safe
      } else {
        setOnboardingCompleted(data?.onboarding_completed ?? false);
        setUserRole(data?.role || 'professional');
      }
    } catch (err) {
      console.error('Onboarding check error:', err);
      setOnboardingCompleted(true);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  // Handle redirects
  useEffect(() => {
    if (checkingOnboarding || onboardingCompleted === null) return;
    if (!user) return;

    const isOnboardingPage = location.pathname === '/onboarding';
    const isAssistantPortal = location.pathname === '/portal-assistente';

    // 1. ASSISTANT GUARD
    if (userRole === 'assistant') {
      if (!isAssistantPortal) {
        navigate('/portal-assistente', { replace: true });
      }
      return;
    }

    // 2. ADMIN/PROFESSIONAL LOGIC
    if (location.pathname === '/planos') return;

    // Completed onboarding trying to access onboarding page
    if (onboardingCompleted && isOnboardingPage) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Not completed onboarding and not on onboarding page
    if (!onboardingCompleted && !isOnboardingPage && requireOnboarding) {
      navigate('/onboarding', { replace: true });
      return;
    }
  }, [checkingOnboarding, onboardingCompleted, userRole, location.pathname, user, requireOnboarding]);

  // Subscription check (only for admins/pros)
  useEffect(() => {
    if (authLoading || checkingOnboarding || subLoading) return;
    if (!user || userRole === 'assistant') return; // Skip for assistants
    if (!onboardingCompleted && requireOnboarding) return;

    // Allow 'trial' status to access Dashboard
    // Only redirect if explicitly 'expired' and not on billing pages
    if (status === 'expired' && location.pathname !== '/planos' && location.pathname !== '/configuracoes') {
      navigate('/planos');
    }
  }, [status, subLoading, location.pathname, user, onboardingCompleted, authLoading, checkingOnboarding, userRole]);

  if (authLoading || checkingOnboarding || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (!user) return null;

  // Allow rendering based on logic
  const isOnboardingPage = location.pathname === '/onboarding';
  const isAssistantPortal = location.pathname === '/portal-assistente';

  // Assistant Logic
  if (userRole === 'assistant') {
    if (isAssistantPortal) return <>{children}</>;
    // If not portal, we are waiting for redirect
    return null;
  }

  // Admin/Pro Logic
  if (!requireOnboarding) return <>{children}</>;
  if (isOnboardingPage && !onboardingCompleted) return <>{children}</>;
  if (!isOnboardingPage && onboardingCompleted) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <Loader2 className="h-8 w-8 animate-spin text-white/60" />
    </div>
  );
};

export default ProtectedRoute;
