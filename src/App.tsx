import { Toaster } from '@/components/ui/toaster'
import { useEffect, useState, lazy, Suspense } from 'react'
import { SplashScreen } from './components/ui/layout/SplashScreen'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminRoute from '@/features/auth/AdminRoute'
import { AIProvider } from '@/contexts/AIProvider'
const AIController = lazy(() => import('./features/ai/components/AIController'))

const AuthCallbackHandler = lazy(
  () => import('@/features/auth/AuthCallbackHandler'),
)
const MFAVerifyPage = lazy(() => import('@/features/auth/pages/MFAVerifyPage'))

import AppLayout from './components/ui/layout/AppLayout'
import MarketingLayout from './components/ui/layout/MarketingLayout'
import { ScrollToTop } from './components/utils/ScrollToTop'
import { GoogleAnalytics } from './components/analytics/GoogleAnalytics'
import { PageLoader } from '@/components/ui/page-loader'

import { ErrorBoundary } from '@/components/ui/error-boundary'
import { PageErrorFallback } from '@/components/ui/page-error-fallback'
import { SkipToContent } from '@/components/a11y/SkipToContent'
import { PlanGate } from '@/components/access/PlanGate'
const CanvasPanel = lazy(() =>
  import('./components/ai/canvas/CanvasPanel').then((m) => ({
    default: m.CanvasPanel,
  })),
)

const Index = lazy(() => import('./pages/HomePage'))
const Login = lazy(() => import('@/features/auth/pages/Login'))
const Register = lazy(() => import('@/features/auth/pages/Register'))
const Resources = lazy(() => import('./pages/Resources'))
const Plans = lazy(() => import('./pages/Plans'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogArticle = lazy(() => import('./pages/BlogArticle'))
const ForgotPassword = lazy(
  () => import('@/features/auth/pages/ForgotPassword'),
)
const UpdatePassword = lazy(
  () => import('@/features/auth/pages/UpdatePassword'),
)
const Dashboard = lazy(() => import('@/features/dashboard/pages/Dashboard'))
const BrideLoginPage = lazy(
  () => import('@/features/portal/pages/BrideLoginPage'),
)
const BrideDashboardPage = lazy(
  () => import('@/features/portal/pages/BrideDashboardPage'),
)
const BrideProtectedRoute = lazy(
  () => import('@/features/portal/components/BrideProtectedRoute'),
)
const FinancialPage = lazy(
  () => import('@/features/financial/pages/FinancialPage'),
)
const AdminDashboard = lazy(() => import('@/features/admin/AdminDashboard'))
const Clients = lazy(() => import('@/features/clients/pages/ClientsPage'))
const ClientDetails = lazy(
  () => import('@/features/clients/pages/ClientDetailsPage'),
)
const ProjectDetails = lazy(
  () => import('@/features/projects/pages/ProjectDetailsPage'),
)
const Settings = lazy(() => import('./pages/Settings'))
const WorkflowsPage = lazy(
  () => import('./features/workflows/pages/WorkflowsPage'),
)
const Contact = lazy(() => import('./pages/Contact'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const AssistantsPage = lazy(
  () => import('@/features/assistants/pages/AssistantsPage'),
)
const Services = lazy(() => import('./pages/Services'))
const Marketing = lazy(() => import('./pages/Marketing'))
const NetworkPage = lazy(
  () => import('@/features/network/pages/NetworkPage'),
)
const MyPeerEventsPage = lazy(
  () => import('@/features/network/pages/MyPeerEventsPage'),
)
const Contracts = lazy(() => import('@/features/contracts/pages/Contracts'))
const ProjectContract = lazy(
  () => import('@/features/contracts/pages/ProjectContract'),
)
const NotFound = lazy(() => import('./pages/NotFound'))
const Refund = lazy(() => import('@/pages/Refund'))
const Security = lazy(() => import('@/pages/Security'))
const Cookies = lazy(() => import('@/pages/Cookies'))
const DPA = lazy(() => import('@/pages/DPA'))
const StudioCalendarPage = lazy(
  () => import('@/features/calendar/pages/StudioCalendarPage'),
)
const PublicBooking = lazy(
  () => import('@/features/public-booking/pages/PublicBooking'),
)
const Analytics = lazy(() => import('./pages/Analytics'))
const AssistantDashboard = lazy(
  () => import('@/features/assistant-portal/pages/AssistantDashboard'),
)
const AssistantLayout = lazy(
  () => import('@/components/ui/layout/AssistantLayout'),
)
const UpgradePage = lazy(
  () => import('@/features/assistant-portal/pages/UpgradePage'),
)
const UpgradeSuccessPage = lazy(
  () => import('@/features/assistant-portal/pages/UpgradeSuccessPage'),
)
const UpgradeFailurePage = lazy(
  () => import('@/features/assistant-portal/pages/UpgradeFailurePage'),
)
const UpgradePendingPage = lazy(
  () => import('@/features/assistant-portal/pages/UpgradePendingPage'),
)
const CalendarPage = lazy(
  () => import('@/features/calendar/pages/CalendarPage'),
)
const GoogleCalendarCallback = lazy(
  () => import('@/pages/GoogleCalendarCallback'),
)
const CheckoutReturn = lazy(
  () => import('@/features/billing/pages/CheckoutReturn'),
)
const BillingPage = lazy(
  () => import('@/features/billing/pages/BillingPage'),
)
const HelpPage = lazy(() => import('@/pages/Help'))
const HelpArticlePage = lazy(() => import('@/pages/HelpArticle'))
const SignContract = lazy(
  () => import('@/features/contracts/pages/SignContract'),
)
const LeaveReview = lazy(() => import('@/pages/LeaveReview'))
const Microsite = lazy(() => import('@/features/microsite/pages/Microsite'))
const MicrositeEditor = lazy(
  () => import('@/features/microsite/pages/MicrositeEditor'),
)
const SalesPipeline = lazy(
  () => import('@/features/pipeline/pages/SalesPipeline'),
)
const IntegrationsPage = lazy(() => import('./pages/Integrations'))
const AssistantQuickLogin = lazy(
  () => import('@/features/assistant-portal/pages/AssistantQuickLogin'),
)
const AssistantFreeDashboard = lazy(
  () => import('@/features/assistant-portal/pages/AssistantFreeDashboard'),
)
const StudioAvailabilityPage = lazy(
  () => import('@/features/calendar/pages/StudioAvailabilityPage'),
)

import '@/styles/calendar.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function LazyPage({
  component: Component,
}: {
  component: React.ComponentType
}) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <PageErrorFallback error={error} onRetry={reset} />
      )}
    >
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  )
}

const App = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setIsLoading(false)
      },
      window.innerWidth >= 768 ? 0 : 2500,
    )

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <BrowserRouter>
      <Toaster />
      <Sonner />
      <ScrollToTop />
      <GoogleAnalytics />
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <AnalyticsProvider>
            <Suspense fallback={null}>
              <CanvasPanel />
            </Suspense>
            <AIProvider>
              <div className="min-h-screen bg-[#050505] text-[#C0C0C0] selection:bg-white selection:text-black">
                <SkipToContent />
                <main id="main-content">
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route
                          path="/"
                          element={<LazyPage component={Index} />}
                        />
                        <Route element={<MarketingLayout />}>
                          <Route
                            path="/recursos"
                            element={<LazyPage component={Resources} />}
                          />
                          <Route
                            path="/planos"
                            element={<LazyPage component={Plans} />}
                          />
                          <Route
                            path="/blog"
                            element={<LazyPage component={Blog} />}
                          />
                          <Route
                            path="/blog/:slug"
                            element={<LazyPage component={BlogArticle} />}
                          />
                          <Route
                            path="/contato"
                            element={<LazyPage component={Contact} />}
                          />
                          <Route
                            path="/ajuda"
                            element={<LazyPage component={HelpPage} />}
                          />
                          <Route
                            path="/ajuda/:slug"
                            element={<LazyPage component={HelpArticlePage} />}
                          />
                          <Route
                            path="/privacidade"
                            element={<LazyPage component={Privacy} />}
                          />
                          <Route
                            path="/termos"
                            element={<LazyPage component={Terms} />}
                          />
                          <Route
                            path="/reembolso"
                            element={<LazyPage component={Refund} />}
                          />
                          <Route
                            path="/seguranca"
                            element={<LazyPage component={Security} />}
                          />
                          <Route
                            path="/cookies"
                            element={<LazyPage component={Cookies} />}
                          />
                          <Route
                            path="/dpa"
                            element={<LazyPage component={DPA} />}
                          />
                        </Route>

                        <Route
                          path="/login"
                          element={<LazyPage component={Login} />}
                        />
                        <Route
                          path="/register"
                          element={<LazyPage component={Register} />}
                        />
                        <Route
                          path="/cadastro"
                          element={<LazyPage component={Register} />}
                        />
                        <Route path="/auth">
                          <Route
                            index
                            element={<Navigate to="/login" replace />}
                          />
                          <Route
                            path="login"
                            element={<Navigate to="/login" replace />}
                          />
                          <Route
                            path="register"
                            element={<Navigate to="/register" replace />}
                          />
                          <Route
                            path="mfa-verify"
                            element={<MFAVerifyPage />}
                          />
                        </Route>
                        <Route
                          path="/auth/callback"
                          element={<AuthCallbackHandler />}
                        />
                        <Route
                          path="/auth/forgot-password"
                          element={<LazyPage component={ForgotPassword} />}
                        />
                        <Route
                          path="/auth/update-password"
                          element={<LazyPage component={UpdatePassword} />}
                        />

                        <Route element={<AppLayout />}>
                          <Route element={<ProtectedRoute />}>
                            <Route
                              path="/dashboard"
                              element={<LazyPage component={Dashboard} />}
                            />
                            <Route
                              path="/dashboard/financial"
                              element={<LazyPage component={FinancialPage} />}
                            />
                            <Route
                              path="/analytics"
                              element={
                                <PlanGate plan="profissional">
                                  <LazyPage component={Analytics} />
                                </PlanGate>
                              }
                            />

                            <Route element={<AdminRoute />}>
                              <Route
                                path="/admin"
                                element={
                                  <LazyPage component={AdminDashboard} />
                                }
                              />
                              <Route
                                path="/admin/users"
                                element={
                                  <Navigate to="/admin?tab=users" replace />
                                }
                              />
                              <Route
                                path="/admin/dashboard"
                                element={
                                  <Navigate to="/admin?tab=overview" replace />
                                }
                              />
                            </Route>

                            <Route
                              path="/calendar"
                              element={<LazyPage component={CalendarPage} />}
                            />
                            <Route
                              path="/calendar/callback"
                              element={
                                <LazyPage component={GoogleCalendarCallback} />
                              }
                            />
                            <Route
                              path="/studio"
                              element={<LazyPage component={StudioCalendarPage} />}
                            />

                            <Route
                              path="/clientes"
                              element={<LazyPage component={Clients} />}
                            />
                            <Route
                              path="/clientes/:id"
                              element={<LazyPage component={ClientDetails} />}
                            />
                            <Route
                              path="/projetos"
                              element={<Navigate to="/clientes" replace />}
                            />
                            <Route
                              path="/projetos/novo"
                              element={<Navigate to="/clientes" replace />}
                            />
                            <Route
                              path="/projetos/:id"
                              element={<LazyPage component={ProjectDetails} />}
                            />
                            <Route
                              path="/projects/:projectId/contract"
                              element={<LazyPage component={ProjectContract} />}
                            />
                            <Route
                              path="/configuracoes"
                              element={<LazyPage component={Settings} />}
                            />
                            <Route
                              path="/automacoes"
                              element={
                                <PlanGate plan="profissional">
                                  <LazyPage component={WorkflowsPage} />
                                </PlanGate>
                              }
                            />
                            <Route
                              path="/billing"
                              element={<LazyPage component={BillingPage} />}
                            />
                            <Route
                              path="/configuracoes/assinatura"
                              element={<LazyPage component={BillingPage} />}
                            />
                            <Route
                              path="/assistentes"
                              element={
                                <PlanGate plan="studio">
                                  <LazyPage component={AssistantsPage} />
                                </PlanGate>
                              }
                            />
                            <Route
                              path="/rede"
                              element={
                                <PlanGate plan="studio">
                                  <LazyPage component={NetworkPage} />
                                </PlanGate>
                              }
                            />
                            <Route
                              path="/meus-reforcos"
                              element={
                                <LazyPage component={MyPeerEventsPage} />
                              }
                            />
                            <Route
                              path="/servicos"
                              element={<LazyPage component={Services} />}
                            />
                            <Route
                              path="/funil"
                              element={
                                <PlanGate plan="profissional">
                                  <LazyPage component={SalesPipeline} />
                                </PlanGate>
                              }
                            />
                            <Route
                              path="/integracoes"
                              element={
                                <PlanGate plan="studio">
                                  <LazyPage component={IntegrationsPage} />
                                </PlanGate>
                              }
                            />
                            <Route
                              path="/contratos"
                              element={<LazyPage component={Contracts} />}
                            />
                            <Route
                              path="/marketing"
                              element={
                                <PlanGate plan="profissional">
                                  <LazyPage component={Marketing} />
                                </PlanGate>
                              }
                            />
                          </Route>
                        </Route>


                        <Route element={<ProtectedRoute />}>
                          <Route
                            path="/assistant"
                            element={
                              <PlanGate plan="profissional">
                                <AssistantLayout />
                              </PlanGate>
                            }
                          >
                            <Route
                              path="dashboard"
                              element={
                                <LazyPage component={AssistantDashboard} />
                              }
                            />
                            <Route
                              index
                              element={<Navigate to="dashboard" replace />}
                            />
                          </Route>
                        </Route>
                        <Route
                          path="/upgrade"
                          element={<LazyPage component={UpgradePage} />}
                        />
                        <Route
                          path="/upgrade/success"
                          element={<LazyPage component={UpgradeSuccessPage} />}
                        />
                        <Route
                          path="/upgrade/failure"
                          element={<LazyPage component={UpgradeFailurePage} />}
                        />
                        <Route
                          path="/upgrade/pending"
                          element={<LazyPage component={UpgradePendingPage} />}
                        />
                        <Route
                          path="/checkout/return"
                          element={<LazyPage component={CheckoutReturn} />}
                        />
                        <Route
                          path="/b/:slug"
                          element={<LazyPage component={PublicBooking} />}
                        />

                        <Route
                          path="/agenda-equipa/:professionalId"
                          element={<LazyPage component={AssistantQuickLogin} />}
                        />
                        <Route
                          path="/agenda-equipa/:professionalId/dashboard"
                          element={
                            <LazyPage component={AssistantFreeDashboard} />
                          }
                        />
                        <Route
                          path="/agenda-equipa/:professionalId/disponibilidade"
                          element={
                            <LazyPage component={StudioAvailabilityPage} />
                          }
                        />

                        <Route
                          path="/assinar/:requestId"
                          element={<LazyPage component={SignContract} />}
                        />
                        <Route
                          path="/avaliar/:token"
                          element={<LazyPage component={LeaveReview} />}
                        />
                        <Route
                          path="/site/:slug"
                          element={<LazyPage component={Microsite} />}
                        />
                        <Route element={<ProtectedRoute />}>
                          <Route
                            path="/meu-site/editor"
                            element={<LazyPage component={MicrositeEditor} />}
                          />
                        </Route>
                        <Route
                          path="/portal/:clientId/login"
                          element={<LazyPage component={BrideLoginPage} />}
                        />
                        <Route element={<BrideProtectedRoute />}>
                          <Route
                            path="/portal/:clientId/dashboard"
                            element={
                              <LazyPage component={BrideDashboardPage} />
                            }
                          />
                        </Route>
                        <Route
                          path="*"
                          element={<LazyPage component={NotFound} />}
                        />
                        <Route
                          path="/404"
                          element={<LazyPage component={NotFound} />}
                        />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </main>
              </div>
              <Suspense fallback={null}>
                <AIController />
              </Suspense>
            </AIProvider>
          </AnalyticsProvider>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

