import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function AdminRoute() {
    const { user, isAdmin, loading, session } = useAuth();
    // Double check logic: current isAdmin in useAuth already includes the email check.
    // However, if there's a delay, we might get redirected.
    // Let's rely on useAuth's isAdmin which I previously updated to include the email check.

    // We need to ensure we don't redirect while loading
    // And if we have a session but isAdmin is false, we verify if it is arguably valid.

    // Check if hardcoded email is present in user object directly
    const isHardcodedAdmin = user?.email === 'prenata@gmail.com';
    const effectiveIsAdmin = isAdmin || isHardcodedAdmin;

    useEffect(() => {
        if (!loading && session && !effectiveIsAdmin) {
            toast.error("Acesso restrito: Área exclusiva para administradores.");
        }
    }, [loading, session, effectiveIsAdmin]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#050505]">
                <Loader2 className="w-8 h-8 text-[#00e5ff] animate-spin" />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/auth/login" replace />;
    }

    if (!effectiveIsAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
