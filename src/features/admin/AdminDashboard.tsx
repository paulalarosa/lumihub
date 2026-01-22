import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Settings, AlertCircle, LogOut, Menu, X, CreditCard, Megaphone, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminOverview from '@/features/admin/AdminOverview';
import AdminUsers from '@/features/admin/AdminUsers';
import AdminConfig from '@/features/admin/AdminConfig';
import AdminLogs from '@/features/admin/AdminLogs';
import AdminSubscriptions from '@/features/admin/AdminSubscriptions';
import MFAEnrollment from '@/features/auth/MFAEnrollment';
import AdminSecurity from '@/features/admin/AdminSecurity';
import AdminAnalytics from '@/features/admin/AdminAnalytics';
import AdminIntegrations from '@/features/admin/AdminIntegrations';
import AdminAssistants from '@/features/admin/AdminAssistants';

type AdminTab = 'overview' | 'users' | 'assistants' | 'subscriptions' | 'marketing' | 'config' | 'logs' | 'security' | 'analytics' | 'integrations';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin: authIsAdmin, loading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeTab = (searchParams.get('tab') as AdminTab) || 'overview';

  const isAuthorizedAdmin = authIsAdmin || user?.email === 'prenata@gmail.com';

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }

      if (!isAuthorizedAdmin) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    }
  }, [user, authLoading, navigate, isAuthorizedAdmin]);

  const setTab = (tab: AdminTab) => {
    setSearchParams({ tab });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground font-mono uppercase tracking-widest text-xs">Verificando acesso...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { id: 'overview' as AdminTab, label: 'Visão Geral', icon: BarChart3 },
    { id: 'users' as AdminTab, label: 'Usuários', icon: Users },
    { id: 'assistants' as AdminTab, label: 'Assistentes', icon: Users },
    { id: 'integrations' as AdminTab, label: 'Integrações (Status)', icon: Settings },
    { id: 'subscriptions' as AdminTab, label: 'Assinaturas & Planos', icon: CreditCard },
    { id: 'marketing' as AdminTab, label: 'Marketing Global', icon: Megaphone },
    { id: 'config' as AdminTab, label: 'Configurações', icon: Settings },
    { id: 'security' as AdminTab, label: 'Segurança', icon: ShieldCheck },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart3 },
    { id: 'logs' as AdminTab, label: 'Logs de Erro', icon: AlertCircle },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Internal Sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } bg-background border-r border-border flex flex-col transition-all duration-300 relative z-20`}
      >
        <div className="p-6 border-b border-border">
          <h1 className="text-foreground font-serif text-2xl font-bold">
            {sidebarOpen ? 'LUMI_CORE' : 'LC'}
          </h1>
          <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest">
            {sidebarOpen ? 'System_Admin' : 'SA'}
          </p>
        </div>

        <nav className="flex-1 p-0 space-y-0.5 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 transition-colors relative group
                  ${isActive
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-background" />
                )}
                <Icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-xs font-mono uppercase tracking-widest">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-muted-foreground hover:text-foreground p-2 flex items-center justify-center hover:bg-muted transition-colors rounded-none"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 rounded-none font-mono text-xs uppercase tracking-widest"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {sidebarOpen && 'LOGOUT'}
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="bg-background border-b border-border px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-foreground font-serif text-3xl font-light tracking-tight">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
            <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest mt-1">
              Terminal Access: {user?.email}
            </p>
          </div>
          <div className="h-8 w-8 border border-border flex items-center justify-center bg-background">
            <ShieldCheck className="h-4 w-4 text-foreground" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-muted/20 p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && <AdminOverview />}
            {activeTab === 'users' && <AdminUsers />}
            {activeTab === 'assistants' && <AdminAssistants />}
            {activeTab === 'subscriptions' && <AdminSubscriptions />}
            {activeTab === 'marketing' && (
              <div className="text-muted-foreground text-center py-20 border border-border bg-card p-12">
                <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-serif text-foreground mb-2">Marketing Global</h3>
                <p className="font-mono text-xs uppercase tracking-widest">
                  Module_Under_Construction...
                </p>
              </div>
            )}
            {activeTab === 'config' && <AdminConfig />}
            {activeTab === 'security' && <AdminSecurity />}
            {activeTab === 'analytics' && <AdminAnalytics />}
            {activeTab === 'logs' && <AdminLogs />}
            {activeTab === 'integrations' && <AdminIntegrations />}
          </div>
        </div>
      </div>
    </div>
  );
}
