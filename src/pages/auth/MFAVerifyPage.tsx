
import MFAVerification from "@/components/auth/MFAVerification";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

export default function MFAVerifyPage() {
    const { user, session } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/admin';

    if (!session) {
        return <Navigate to="/auth/login" replace />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <MFAVerification onSuccess={() => navigate(redirectTo, { replace: true })} />
        </div>
    );
}
