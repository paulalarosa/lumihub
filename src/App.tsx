import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import Home from "./pages/Home";
import Recursos from "./pages/Recursos";
import Planos from "./pages/Planos";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import AdminUsers from "./pages/admin/Users";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import FinancialDashboard from "./pages/FinancialDashboard";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import Clientes from "./pages/Clientes";
import ClienteDetalhes from "./pages/ClienteDetalhes";
import Projetos from "./pages/Projetos";
import ProjetoDetalhes from "./pages/ProjetoDetalhes";
import ProjectDetails from "./pages/ProjectDetails";
import Configuracoes from "./pages/Configuracoes";
import PortalCliente from "./pages/PortalCliente";
import PortalAssistente from "./pages/PortalAssistente";
import AssistantInvite from "./pages/AssistantInvite";
import Agenda from "./pages/Agenda";
import Contato from "./pages/Contato";
import Privacidade from "./pages/Privacidade";
import Assistentes from "./pages/Assistentes";
import Servicos from "./pages/Servicos";
import Marketing from "./pages/Marketing";
import Contratos from "./pages/Contratos";
import ProjectContract from "./pages/ProjectContract";
import NotFound from "./pages/NotFound";
import AIAssistantChat from "./components/ai-assistant/AIAssistantChat";
import DebugConnection from "./pages/DebugConnection";
import AuthCallbackHandler from "./components/auth/AuthCallbackHandler";
import PublicBooking from "./pages/PublicBooking";
import AppLayout from "./components/layout/AppLayout";
import MarketingLayout from "./components/layout/MarketingLayout";
import { ErrorBoundary } from "@/components/ui/error-boundary";

import InviteLanding from "./pages/InviteLanding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>

            {/* Public Marketing Pages */}
            <div className="min-h-screen bg-[#050505] text-[#C0C0C0] selection:bg-[#00e5ff]/30 selection:text-[#00e5ff]">
              <Routes>
                <Route element={<MarketingLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/recursos" element={<Recursos />} />
                  <Route path="/planos" element={<Planos />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogArticle />} />
                  <Route path="/contato" element={<Contato />} />
                  <Route path="/privacidade" element={<Privacidade />} />
                </Route>
                <Route path="/debug" element={<DebugConnection />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth">
                  <Route index element={<Navigate to="/login" replace />} />
                  <Route path="login" element={<Navigate to="/login" replace />} />
                  <Route path="register" element={<Navigate to="/register" replace />} />
                </Route>
                <Route path="/auth/callback" element={<AuthCallbackHandler />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/update-password" element={<UpdatePassword />} />
                <Route path="/onboarding" element={
                  <ProtectedRoute requireOnboarding={false}>
                    <Onboarding />
                  </ProtectedRoute>
                } />

                {/* Protected App Pages with Layout */}
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/financial" element={
                    <ProtectedRoute>
                      <FinancialDashboard />
                    </ProtectedRoute>
                  } />
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<Navigate to="/admin?tab=users" replace />} />
                    <Route path="/admin/dashboard" element={<Navigate to="/admin?tab=overview" replace />} />
                  </Route>
                  <Route path="/clientes" element={
                    <ProtectedRoute>
                      <Clientes />
                    </ProtectedRoute>
                  } />
                  <Route path="/clientes/:id" element={
                    <ProtectedRoute>
                      <ClienteDetalhes />
                    </ProtectedRoute>
                  } />
                  <Route path="/projetos" element={
                    <ProtectedRoute>
                      <Projetos />
                    </ProtectedRoute>
                  } />
                  <Route path="/projetos/novo" element={
                    <ProtectedRoute>
                      <Projetos />
                    </ProtectedRoute>
                  } />
                  <Route path="/projetos/:id" element={
                    <ProtectedRoute>
                      <ProjetoDetalhes />
                    </ProtectedRoute>
                  } />
                  <Route path="/projects/:id" element={
                    <ProtectedRoute>
                      <ProjectDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/projects/:projectId/contract" element={
                    <ProtectedRoute>
                      <ProjectContract />
                    </ProtectedRoute>
                  } />
                  <Route path="/configuracoes" element={
                    <ProtectedRoute>
                      <Configuracoes />
                    </ProtectedRoute>
                  } />
                  <Route path="/agenda" element={
                    <ProtectedRoute>
                      <Agenda />
                    </ProtectedRoute>
                  } />
                  <Route path="/assistentes" element={
                    <ProtectedRoute>
                      <Assistentes />
                    </ProtectedRoute>
                  } />
                  <Route path="/servicos" element={
                    <ProtectedRoute>
                      <Servicos />
                    </ProtectedRoute>
                  } />
                  <Route path="/contratos" element={
                    <ProtectedRoute>
                      <Contratos />
                    </ProtectedRoute>
                  } />
                  <Route path="/marketing" element={
                    <ProtectedRoute>
                      <Marketing />
                    </ProtectedRoute>
                  } />
                  {/* Assistant Portal - also uses layout? Maybe separate layout for assistant? 
                    For now, use AppLayout but Sidebar might need to adapt. 
                    Assistant Dashboard is /assistente (PortalAssistente). 
                    Let's keep it in layout for now. 
                */}
                  <Route path="/assistente" element={
                    <ProtectedRoute>
                      <PortalAssistente />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* Assistant Portal */}
                <Route path="/assistente" element={
                  <ProtectedRoute>
                    <PortalAssistente />
                  </ProtectedRoute>
                } />
                <Route path="/assistente/convite/:token" element={<InviteLanding />} />

                {/* Public Client Booking */}
                <Route path="/b/:slug" element={<PublicBooking />} />

                {/* Public Client Portal */}
                <Route path="/portal/:token" element={<PortalCliente />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <AIAssistantChat />
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
