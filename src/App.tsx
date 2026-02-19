import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState, lazy, Suspense } from "react";
import { SplashScreen } from "./components/ui/layout/SplashScreen";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/features/auth/AdminRoute";
import AIController from "./components/ai-assistant/AIController";
import { AIProvider } from "@/contexts/AIProvider";
import AuthCallbackHandler from "@/features/auth/AuthCallbackHandler";
import MFAVerifyPage from "@/features/auth/pages/MFAVerifyPage";
import AppLayout from "./components/ui/layout/AppLayout";
import MarketingLayout from "./components/ui/layout/MarketingLayout";
import { ScrollToTop } from "./components/utils/ScrollToTop";
import { GoogleAnalytics } from "./components/analytics/GoogleAnalytics";
import { PageLoader } from "./components/ui/PageLoader";
import { ErrorBoundary } from "react-error-boundary";
import { SystemFailure } from "./components/ui/SystemFailure";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { CustomErrorBoundary } from "@/components/ui/CustomErrorBoundary";
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { AchievementNotifications } from '@/components/onboarding/AchievementToast';

// Lazy AI Components
const ModernAIChat = lazy(() => import("./components/ai/ModernAIChat").then(m => ({ default: m.ModernAIChat })));
const CanvasPanel = lazy(() => import("./components/ai/canvas/CanvasPanel").then(m => ({ default: m.CanvasPanel })));

// Lazy Imports (Code Splitting)
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("@/features/auth/pages/Login"));
const Register = lazy(() => import("@/features/auth/pages/Register"));
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
const AdminDashboard = lazy(() => import("@/features/admin/AdminDashboard"));
const Clientes = lazy(() => import("@/features/clients/pages/ClientsPage"));
const ClienteDetalhes = lazy(() => import("@/features/clients/pages/ClientDetailsPage"));
const Projetos = lazy(() => import("@/features/projects/pages/ProjectsPage"));
const ProjetoDetalhes = lazy(() => import("@/features/projects/pages/ProjectDetailsPage"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
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
const Analytics = lazy(() => import("./pages/Analytics"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AcceptInvitePage = lazy(() => import("@/pages/assistant/AcceptInvitePage"));
const AssistantDashboard = lazy(() => import("@/pages/assistant/AssistantDashboard"));
const AssistantLayout = lazy(() => import("@/components/ui/layout/AssistantLayout"));
const UpgradePage = lazy(() => import("@/pages/assistant/UpgradePage"));
const UpgradeSuccessPage = lazy(() => import("@/pages/assistant/UpgradeSuccessPage"));
const UpgradeFailurePage = lazy(() => import("@/pages/assistant/UpgradeFailurePage"));
const UpgradePendingPage = lazy(() => import("@/pages/assistant/UpgradePendingPage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const GoogleCalendarCallback = lazy(() => import("@/pages/GoogleCalendarCallback"));
const SignContract = lazy(() => import("@/pages/SignContract"));
const LeaveReview = lazy(() => import("@/pages/LeaveReview"));
const Microsite = lazy(() => import("@/pages/Microsite"));
const MicrositeEditor = lazy(() => import("@/pages/MicrositeEditor"));
const SalesPipeline = lazy(() => import("./pages/SalesPipeline"));
const IntegrationsPage = lazy(() => import("./pages/Integrations"));

// Custom styles
import "@/styles/calendar.css";

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, window.innerWidth >= 768 ? 0 : 2500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <Toaster />
      <Sonner />
      <InstallPrompt />
      <ScrollToTop />
      <GoogleAnalytics />
      <AuthProvider>
        <AnalyticsProvider>
          <Suspense fallback={null}>
            <ModernAIChat />
            <CanvasPanel />
          </Suspense>
          <AIProvider>
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
                            <CustomErrorBoundary>
                              <Dashboard />
                            </CustomErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/dashboard/financial" element={
                          <ProtectedRoute>
                            <FinancialPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/analytics" element={
                          <ProtectedRoute>
                            <Analytics />
                          </ProtectedRoute>
                        } />

                        <Route element={<AdminRoute />}>
                          <Route path="/admin" element={<AdminDashboard />} />
                          <Route path="/admin/users" element={<Navigate to="/admin?tab=users" replace />} />
                          <Route path="/admin/dashboard" element={<Navigate to="/admin?tab=overview" replace />} />
                        </Route>

                        <Route path="/calendar" element={
                          <ProtectedRoute>
                            <CalendarPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/calendar/callback" element={<GoogleCalendarCallback />} />

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
                            <CustomErrorBoundary>
                              <Projetos />
                            </CustomErrorBoundary>
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
                        <Route path="/pricing" element={
                          <ProtectedRoute>
                            <PricingPage />
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
                        <Route path="/funil" element={
                          <ProtectedRoute>
                            <SalesPipeline />
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

                      <Route path="/assistant/accept/:token" element={<AcceptInvitePage />} />
                      <Route path="/assistant" element={
                        <ProtectedRoute>
                          <AssistantLayout />
                        </ProtectedRoute>
                      }>
                        <Route path="dashboard" element={<AssistantDashboard />} />
                        <Route index element={<Navigate to="dashboard" replace />} />
                      </Route>
                      <Route path="/assistente/convite/:token" element={<AcceptInvitePage />} />
                      <Route path="/upgrade" element={<UpgradePage />} />
                      <Route path="/upgrade/success" element={<UpgradeSuccessPage />} />
                      <Route path="/upgrade/failure" element={<UpgradeFailurePage />} />
                      <Route path="/upgrade/pending" element={<UpgradePendingPage />} />
                      <Route path="/b/:slug" element={<PublicBooking />} />
                      <Route path="/assinar/:requestId" element={<SignContract />} />
                      <Route path="/avaliar/:token" element={<LeaveReview />} />
                      <Route path="/site/:slug" element={<Microsite />} />
                      <Route path="/meu-site/editor" element={
                        <ProtectedRoute>
                          <MicrositeEditor />
                        </ProtectedRoute>
                      } />
                      <Route path="/portal/:clientId/login" element={<BrideLoginPage />} />
                      <Route element={<BrideProtectedRoute />}>
                        <Route path="/portal/:clientId/dashboard" element={<BrideDashboardPage />} />
                      </Route>
                      <Route path="*" element={<Dashboard />} />
                      <Route path="/404" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </main>
            </div>
            <AIController />
            <OnboardingWizard />
            <AchievementNotifications />
          </AIProvider>
        </AnalyticsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
