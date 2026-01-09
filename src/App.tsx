import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Recursos from "./pages/Recursos";
import Planos from "./pages/Planos";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Auth from "./pages/Auth";
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
import Contact from "./pages/Contact";
import Assistentes from "./pages/Assistentes";
import ProjectContract from "./pages/ProjectContract";
import NotFound from "./pages/NotFound";
import AIAssistantChat from "./components/ai-assistant/AIAssistantChat";

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
            
            {/* Auth */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected App Pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/financial" element={<FinancialDashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/:id" element={<ClienteDetalhes />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/projetos/novo" element={<Projetos />} />
            <Route path="/projetos/:id" element={<ProjetoDetalhes />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/projects/:projectId/contract" element={<ProjectContract />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/assistentes" element={<Assistentes />} />
            
            {/* Assistant Portal */}
            <Route path="/assistente" element={<PortalAssistente />} />
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
