import { Navigate, Outlet, useParams } from "react-router-dom";

export default function BrideProtectedRoute() {
    const { clientId } = useParams();
    const sessionId = localStorage.getItem('bride_auth_id');

    // 1. PIN-based Session Logic (No Email/Password)
    // The session is valid if the ID in localStorage matches the requested URL ID
    const isValidSession = sessionId && sessionId === clientId;

    if (!isValidSession) {
        // Redirect to login if session invalid
        return <Navigate to={`/portal/${clientId}/login`} replace />;
    }

    return <Outlet />;
}
