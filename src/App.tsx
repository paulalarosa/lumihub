import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { SplashScreen } from "./components/ui/layout/SplashScreen";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/features/auth/AdminRoute";
import Home from "./pages/Home";
import Recursos from "./pages/Recursos";
import Planos from "./pages/Planos";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Auth from "@/features/auth/pages/Auth";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import UpdatePassword from "@/features/auth/pages/UpdatePassword";
import AdminUsers from "@/features/users/pages/UsersPage";
import Onboarding from "./pages/Onboarding";
import Dashboard from "@/features/dashboard/pages/Dashboard";
import BrideLoginPage from "@/features/portal/pages/BrideLoginPage";
import BrideDashboardPage from "@/features/portal/pages/BrideDashboardPage";
import BrideProtectedRoute from "@/features/portal/components/BrideProtectedRoute";
import FinancialPage from "@/features/financial/pages/FinancialPage";
import Admin from "./pages/Admin";
import AdminDashboard from "./features/admin/AdminDashboard";
import Clientes from "@/features/clients/pages/ClientsPage";
import ClienteDetalhes from "@/features/clients/pages/ClientDetailsPage";
import Projetos from "@/features/projects/pages/ProjectsPage";
import ProjetoDetalhes from "@/features/projects/pages/ProjectDetailsPage";
import Configuracoes from "./pages/Configuracoes";
import PortalCliente from "./pages/PortalCliente";
import AssistantPortalPage from "@/features/portal/pages/AssistantPortalPage";
import AssistantInvitePage from "@/features/portal/pages/AssistantInvitePage";
import AgendaPage from "@/features/calendar/pages/AgendaPage";
import Contato from "./pages/Contato";
import Privacidade from "./pages/Privacidade";
import Termos from "./pages/Termos";
import AssistantsPage from "@/features/assistants/pages/AssistantsPage";
import Servicos from "./pages/Servicos";
import Marketing from "./pages/Marketing";
import Contratos from "./pages/Contratos";
import ProjectContract from "./pages/ProjectContract";
import NotFound from "./pages/NotFound";
import AIController from "./components/ai-assistant/AIController";
import DebugConnection from "./pages/DebugConnection";
import AuthCallbackHandler from "@/features/auth/AuthCallbackHandler";
import MFAVerifyPage from "@/features/auth/pages/MFAVerifyPage";
import PublicBooking from "./pages/PublicBooking";
import AppLayout from "./components/ui/layout/AppLayout";
import MarketingLayout from "./components/ui/layout/MarketingLayout";
import { ErrorFallback } from "./components/ui/error-fallback";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

import { ScrollToTop } from "./components/utils/ScrollToTop";
import InviteLanding from "./pages/InviteLanding";
import { GoogleAnalytics } from "./components/analytics/GoogleAnalytics";


const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Test Sentry Connection (Removed)
  useEffect(() => {
    // Simulate loading time (or wait for resources)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, window.innerWidth >= 768 ? 0 : 2500); // Instant on desktop, 2.5s on mobile

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <GoogleAnalytics />
              <AuthProvider>
                <AnalyticsProvider>

                  {/* Public Marketing Pages */}
                  <div className="min-h-screen bg-[#050505] text-[#C0C0C0] selection:bg-white selection:text-black">
                    <Routes>
                      {/* Public Marketing Pages */}
                      <Route path="/" element={<Home />} />
                      <Route element={<MarketingLayout />}>
                        <Route path="/recursos" element={<Recursos />} />
                        <Route path="/planos" element={<Planos />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/:slug" element={<BlogArticle />} />
                        <Route path="/contato" element={<Contato />} />
                        <Route path="/privacidade" element={<Privacidade />} />
                        <Route path="/termos" element={<Termos />} />
                      </Route>
                      <Route path="/debug" element={<DebugConnection />} />

                      {/* Auth */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/auth">
                        <Route index element={<Navigate to="/login" replace />} />
                        <Route path="login" element={<Navigate to="/login" replace />} />
                        <Route path="register" element={<Navigate to="/register" replace />} />
                        <Route path="mfa-verify" element={<MFAVerifyPage />} />
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
                            <FinancialPage />
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
                        <Route path="/agenda" element={
                          <ProtectedRoute>
                            <AgendaPage />
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
                        <Route path="/assistentes" element={
                          <ProtectedRoute>
                            <AssistantsPage />
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
                      </Route>

                      {/* Assistant Portal - Explicit Route */}
                      <Route path="/portal-assistente" element={
                        <ProtectedRoute requireOnboarding={false}>
                          <PortalAssistente />
                        </ProtectedRoute>
                      } />

                      <Route path="/assistente/convite/:token" element={<InviteLanding />} />

                      {/* Public Client Booking */}
                      <Route path="/b/:slug" element={<PublicBooking />} />

                      {/* Password-less Portal (Restored) - Outside AppLayout */}
                      <Route path="/portal/:clientId/login" element={<BrideLoginPage />} />
                      {/* Password-less Portal Check */}
                      <Route element={<BrideProtectedRoute />}>
                        <Route path="/portal/:clientId/dashboard" element={<BrideDashboardPage />} />
                      </Route>

                      {/* Catch-all */}
                      <Route path="*" element={<Dashboard />} /> {/* Redirect * to Dashboard instead of NotFound to catch all */}
                      <Route path="/404" element={<NotFound />} />
                    </Routes>
                  </div>
                  <AIController />
                </AnalyticsProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
