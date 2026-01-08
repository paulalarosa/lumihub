import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Recursos from "./pages/Recursos";
import Planos from "./pages/Planos";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Clientes from "./pages/Clientes";
import ClienteDetalhes from "./pages/ClienteDetalhes";
import Projetos from "./pages/Projetos";
import ProjetoDetalhes from "./pages/ProjetoDetalhes";
import Configuracoes from "./pages/Configuracoes";
import PortalCliente from "./pages/PortalCliente";
import Agenda from "./pages/Agenda";
import Assistentes from "./pages/Assistentes";
import NotFound from "./pages/NotFound";

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
            
            {/* Auth */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected App Pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/:id" element={<ClienteDetalhes />} />
            <Route path="/projetos" element={<Projetos />} />
            <Route path="/projetos/novo" element={<Projetos />} />
            <Route path="/projetos/:id" element={<ProjetoDetalhes />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/assistentes" element={<Assistentes />} />
            
            {/* Public Client Portal */}
            <Route path="/portal/:token" element={<PortalCliente />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
