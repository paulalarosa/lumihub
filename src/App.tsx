import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState, lazy, Suspense } from "react";
import { SplashScreen } from "./components/ui/layout/SplashScreen";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/features/auth/AdminRoute";
import AIController from "./components/ai-assistant/AIController";
import DebugConnection from "./pages/DebugConnection";
import AuthCallbackHandler from "@/features/auth/AuthCallbackHandler";
import MFAVerifyPage from "@/features/auth/pages/MFAVerifyPage";
import AppLayout from "./components/ui/layout/AppLayout";
import MarketingLayout from "./components/ui/layout/MarketingLayout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ScrollToTop } from "./components/utils/ScrollToTop";
import { GoogleAnalytics } from "./components/analytics/GoogleAnalytics";
import { PageLoader } from "./components/ui/PageLoader";
import { ErrorBoundary } from "react-error-boundary";
import { SystemFailure } from "./components/ui/SystemFailure";
import { SkipToContent } from "@/components/a11y/SkipToContent";

// Static Imports (Instant Load)
import Home from "./pages/Home";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";

// Lazy Imports (Code Splitting)
const Recursos = lazy(() => import("./pages/Recursos"));
const Planos = lazy(() => import("./pages/Planos"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const ForgotPassword = lazy(() => import("@/features/auth/pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("@/features/auth/pages/UpdatePassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("@/features/dashboard/pages/Dashboard"));
const BrideLoginPage = lazy(() => import("@/features/portal/pages/BrideLoginPage"));
const BrideDashboardPage = lazy(() => import("@/features/portal/pages/BrideDashboardPage"));
const BrideProtectedRoute = lazy(() => import("@/features/portal/components/BrideProtectedRoute"));
const FinancialPage = lazy(() => import("@/features/financial/pages/FinancialPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Clientes = lazy(() => import("@/features/clients/pages/ClientsPage"));
const ClienteDetalhes = lazy(() => import("@/features/clients/pages/ClientDetailsPage"));
const Projetos = lazy(() => import("@/features/projects/pages/ProjectsPage"));
const ProjetoDetalhes = lazy(() => import("@/features/projects/pages/ProjectDetailsPage"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const AssistantPortalPage = lazy(() => import("@/features/portal/pages/AssistantPortalPage"));
const AgendaPage = lazy(() => import("@/features/calendar/pages/AgendaPage"));
const Contato = lazy(() => import("./pages/Contato"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Termos = lazy(() => import("./pages/Termos"));
const AssistantsPage = lazy(() => import("@/features/assistants/pages/AssistantsPage"));
const Servicos = lazy(() => import("./pages/Servicos"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Contratos = lazy(() => import("./pages/Contratos"));
const ProjectContract = lazy(() => import("./pages/ProjectContract"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicBooking = lazy(() => import("./pages/PublicBooking"));
const InviteLanding = lazy(() => import("./pages/InviteLanding"));


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
                    <SkipToContent />
                    <main id="main-content">
                      <ErrorBoundary FallbackComponent={SystemFailure}>
                        <Suspense fallback={<PageLoader />}>
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
                                <AssistantPortalPage />
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
                        </Suspense>
                      </ErrorBoundary>
                    </main>
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
