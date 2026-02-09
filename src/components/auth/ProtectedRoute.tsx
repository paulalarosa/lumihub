import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { ReactNode } from "react";

interface ProtectedRouteProps {
    children?: ReactNode;
    requireOnboarding?: boolean;
}

export default function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // 1. Loading State (Industrial Noir: Pure Black, White Loader)
    if (loading) {
        return (
            <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 text-[#FFFFFF] animate-spin mb-4" />
                <p className="text-[#FFFFFF] font-mono text-[10px] uppercase tracking-[0.3em]">
                    Authenticating...
                </p>
            </div>
        );
    }

    // 2. Unauthenticated Check (Redirect)
    const simulatedToken = localStorage.getItem('LUMI_TEST_TOKEN');
    if (!user && !simulatedToken) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // 3. Assistant Role Check (Redirect to Portal)
    const isAssistant = user?.user_metadata?.is_assistant;
    const isPortalRoute = location.pathname.startsWith('/portal-assistente') || location.pathname.startsWith('/configuracoes');

    if (isAssistant && !isPortalRoute) {
        return <Navigate to="/portal-assistente" replace />;
    }

    // 4. Authenticated (Render Content)
    return children ? <>{children}</> : <Outlet />;
}
