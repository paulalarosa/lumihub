import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, requireOnboarding = true }: any) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // 1. BYPASS PORTAL ROUTES (Urgent Fix)
  if (location.pathname.startsWith('/portal')) {
    return children ? children : <Outlet />;
  }

  // 2. STRICT LOADING FIRST
  // Wait if loading explicitly TRUE
  // OR if user exists but role is still null (waiting for fetch)
  const isFetchingRole = user && !role;

  if (loading || isFetchingRole) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#C0C0C0] animate-spin mb-4" />
        <p className="text-[#C0C0C0] font-light tracking-widest text-sm uppercase">Autenticando...</p>
      </div>
    );
  }

  // 3. CHECK USER AFTER LOADING
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. RENDER CONTENT
  return children ? children : <Outlet />;
}