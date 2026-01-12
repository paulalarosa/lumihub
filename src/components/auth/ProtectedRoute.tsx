import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCalendar?: boolean;
}

const ProtectedRoute = ({ children, requireCalendar = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingCalendar, setCheckingCalendar] = useState(requireCalendar);
  const [hasCalendar, setHasCalendar] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    if (requireCalendar && user) {
      checkCalendarConnection();
    }
  }, [user, authLoading, requireCalendar]);

  const checkCalendarConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('id, is_active')
        .eq('user_id', user!.id)
        .eq('provider', 'google')
        .maybeSingle();

      if (error) {
        console.error('Error checking calendar:', error);
        setHasCalendar(false);
      } else {
        setHasCalendar(data?.is_active ?? false);
      }
    } catch (err) {
      console.error('Calendar check error:', err);
      setHasCalendar(false);
    } finally {
      setCheckingCalendar(false);
    }
  };

  useEffect(() => {
    if (!checkingCalendar && requireCalendar && hasCalendar === false) {
      // User is logged in but doesn't have calendar connected
      if (location.pathname !== '/onboarding') {
        navigate('/onboarding');
      }
    }
  }, [checkingCalendar, hasCalendar, requireCalendar, location.pathname]);

  if (authLoading || (requireCalendar && checkingCalendar)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireCalendar && hasCalendar === false && location.pathname !== '/onboarding') {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
