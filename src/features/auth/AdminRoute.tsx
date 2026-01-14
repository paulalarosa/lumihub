import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useMFA } from "@/hooks/useMFA";

export default function AdminRoute() {
    const { user, isAdmin, loading: authLoading, session } = useAuth();
    const { checkLevel, listFactors } = useMFA();
    const [isMFAVerified, setIsMFAVerified] = useState<boolean | null>(null);
    const location = useLocation();

    // Specific check for hardcoded admin email
    const isHardcodedAdmin = user?.email === 'prenata@gmail.com';
    const effectiveIsAdmin = isAdmin || isHardcodedAdmin;

    useEffect(() => {
        // Only trigger toast if we are sure we are done loading and user is NOT admin
        if (!authLoading && session && !effectiveIsAdmin) {
            toast.error("Acesso restrito: Área exclusiva para administradores.");
        }
    }, [authLoading, session, effectiveIsAdmin]);

    useEffect(() => {
        const verifyMFA = async () => {
            // Only verify MFA if we have a session and user is admin
            if (session && effectiveIsAdmin) {
                try {
                    const factors = await listFactors();
                    const totpFactor = factors.find(f => f.factor_type === 'totp' && f.status === 'verified');

                    if (totpFactor) {
                        const levelData = await checkLevel();
                        if (levelData && levelData.currentLevel === 'aal2') {
                            setIsMFAVerified(true);
                        } else {
                            setIsMFAVerified(false);
                        }
                    } else {
                        // User has no TOTP enrolled, so we consider them "verified" for the purpose of not blocking
                        // (Or we could force enrollment, but for now allow)
                        setIsMFAVerified(true);
                    }
                } catch (error) {
                    console.error("MFA check failed", error);
                    // If check fails, defaulting to false (secure) or true (permissive)?
                    // Let's safe fail to strictly require MFA if something is wrong?
                    // Or if network error, maybe don't block.
                    // For security, if error, we should probably assume not verified.
                    setIsMFAVerified(false);
                }
            } else if (!session) {
                // No session, will be handled by main render
                setIsMFAVerified(null);
            } else {
                // Not admin
                setIsMFAVerified(true);
            }
        };

        if (!authLoading) {
            verifyMFA();
        }
    }, [session, effectiveIsAdmin, listFactors, checkLevel, authLoading]);

    // BLOCKING STATE:
    // If auth is loading, OR if we are admin and MFA check is still pending
    if (authLoading || (effectiveIsAdmin && isMFAVerified === null)) {
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

    if (effectiveIsAdmin && isMFAVerified === false) {
        return <Navigate to={`/auth/mfa-verify?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
    }

    return <Outlet />;
}
