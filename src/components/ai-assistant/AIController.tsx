import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AIAssistantChat from './AIAssistantChat';
import AIAssistantFAB from './AIAssistantFAB';

export default function AIController() {
    const location = useLocation();
    const { user } = useAuth();
    const path = location.pathname;

    // Define routes
    const isDashboardRoute = path.startsWith('/dashboard') ||
        path.startsWith('/admin') ||
        path.startsWith('/clientes') ||
        path.startsWith('/projetos') ||
        path.startsWith('/configuracoes') ||
        path.startsWith('/agenda') ||
        path.startsWith('/assistentes') ||
        path.startsWith('/servicos') ||
        path.startsWith('/contratos') ||
        path.startsWith('/marketing') ||
        path.startsWith('/assistente'); // Portal assistente

    const isPublicRoute = !isDashboardRoute;

    // 1. Internal AI (Lumi IA)
    // Render if authenticated and inside the internal area/dashboard
    if (user && isDashboardRoute) {
        return <AIAssistantChat />;
    }

    // 2. Sales AI (Lumi Assistant)
    // Render only on public routes.
    // If user is logged in but on public page (e.g. Home), we could still show it, 
    // or hide it. The requirement says: "If the user is logged in and inside the dashboard, this assistant should be hidden."
    // It implies if logged in and on Home, it might be visible, OR we can hide it if logged in generally to avoid confusion.
    // However, "Only render this component if the current path is public" is the primary rule.
    if (isPublicRoute && !path.startsWith('/auth') && !path.startsWith('/portal') && !path.startsWith('/b/')) {
        // Exclude Auth pages, Client Portal and Public Booking from Sales Bot to avoid clutter?
        // Requirement: "e.g., '/', '/login', '/pricing'"
        return <AIAssistantFAB />;
    }

    return null;
}
