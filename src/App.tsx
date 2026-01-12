import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Recursos from "./pages/Recursos";
import Planos from "./pages/Planos";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import FinancialDashboard from "./pages/FinancialDashboard";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminSettings from "./pages/admin/AdminSettings";
import Clientes from "./pages/Clientes";
import ClienteDetalhes from "./pages/ClienteDetalhes";
import Projetos from "./pages/Projetos";
import ProjetoDetalhes from "./pages/ProjetoDetalhes";
import ProjectDetails from "./pages/ProjectDetails";
import Configuracoes from "./pages/Configuracoes";
import MeuNegocio from "./pages/MeuNegocio";
import PortalCliente from "./pages/PortalCliente";
import PortalAssistente from "./pages/PortalAssistente";
import AssistantInvite from "./pages/AssistantInvite";
import Agenda from "./pages/Agenda";
import Contact from "./pages/Contact";
import Assistentes from "./pages/Assistentes";
import ProjectContract from "./pages/ProjectContract";
import NotFound from "./pages/NotFound";
import AIAssistantChat from "./components/ai-assistant/AIAssistantChat";
import DebugConnection from "./pages/DebugConnection";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Marketing Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/recursos" element={<Recursos />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="/debug" element={<DebugConnection />} />
            
            {/* Auth */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Onboarding - After Auth, before protected routes */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            
            {/* Protected App Pages - Require Google Integration */}
            <Route path="/dashboard" element={
              <ProtectedRoute requireGoogleIntegration>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/financial" element={
              <ProtectedRoute requireGoogleIntegration>
                <FinancialDashboard />
              </ProtectedRoute>
            } />
            <Route path="/agenda" element={
              <ProtectedRoute requireGoogleIntegration>
                <Agenda />
              </ProtectedRoute>
            } />
            <Route path="/clientes" element={
              <ProtectedRoute requireGoogleIntegration>
                <Clientes />
              </ProtectedRoute>
            } />
            <Route path="/clientes/:id" element={
              <ProtectedRoute requireGoogleIntegration>
                <ClienteDetalhes />
              </ProtectedRoute>
            } />
            <Route path="/projetos" element={
              <ProtectedRoute requireGoogleIntegration>
                <Projetos />
              </ProtectedRoute>
            } />
            <Route path="/projetos/novo" element={
              <ProtectedRoute requireGoogleIntegration>
                <Projetos />
              </ProtectedRoute>
            } />
            <Route path="/projetos/:id" element={
              <ProtectedRoute requireGoogleIntegration>
                <ProjetoDetalhes />
              </ProtectedRoute>
            } />
            <Route path="/projects/:id" element={
              <ProtectedRoute requireGoogleIntegration>
                <ProjectDetails />
              </ProtectedRoute>
            } />
            <Route path="/projects/:projectId/contract" element={
              <ProtectedRoute requireGoogleIntegration>
                <ProjectContract />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute requireGoogleIntegration>
                <MeuNegocio />
              </ProtectedRoute>
            } />
            <Route path="/contact" element={
              <ProtectedRoute requireGoogleIntegration>
                <Contact />
              </ProtectedRoute>
            } />
            <Route path="/assistentes" element={
              <ProtectedRoute requireGoogleIntegration>
                <Assistentes />
              </ProtectedRoute>
            } />
            
            {/* Admin Area */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/financeiro" element={
              <ProtectedRoute>
                <AdminFinance />
              </ProtectedRoute>
            } />
            <Route path="/admin/configuracoes" element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            } />
            
            {/* Assistant Portal */}
            <Route path="/assistente" element={
              <ProtectedRoute requireGoogleIntegration>
                <PortalAssistente />
              </ProtectedRoute>
            } />
            <Route path="/assistente/convite/:token" element={<AssistantInvite />} />
            
            {/* Public Client Portal */}
            <Route path="/portal/:token" element={<PortalCliente />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIAssistantChat />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
