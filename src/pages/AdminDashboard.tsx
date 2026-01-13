import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Settings, AlertCircle, LogOut, Menu, X, CreditCard, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';

import AdminOverview from '@/components/admin/AdminOverview';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminConfig from '@/components/admin/AdminConfig';
import AdminLogs from '@/components/admin/AdminLogs';
import AdminSubscriptions from '@/components/admin/AdminSubscriptions';

type AdminTab = 'overview' | 'users' | 'subscriptions' | 'marketing' | 'config' | 'logs';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin: authIsAdmin, loading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get active tab from URL or default to overview
  const activeTab = (searchParams.get('tab') as AdminTab) || 'overview';

  // Force admin check
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
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <p className="text-white">Verificando acesso...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { id: 'overview' as AdminTab, label: 'Visão Geral', icon: BarChart3 },
    { id: 'users' as AdminTab, label: 'Usuários', icon: Users },
    { id: 'subscriptions' as AdminTab, label: 'Assinaturas & Planos', icon: CreditCard },
    { id: 'marketing' as AdminTab, label: 'Marketing Global', icon: Megaphone },
    { id: 'config' as AdminTab, label: 'Configurações', icon: Settings },
    { id: 'logs' as AdminTab, label: 'Logs de Erro', icon: AlertCircle },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#121212]">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } bg-[#1A1A1A] border-r border-[#00e5ff]/20 flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#00e5ff]/20">
          <h1 className="text-white font-serif text-2xl font-bold">
            {sidebarOpen ? 'LUMI' : 'L'}
          </h1>
          <p className="text-[#00e5ff] text-xs font-semibold">
            {sidebarOpen ? 'Super Admin' : 'SA'}
          </p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === item.id
                    ? 'bg-[#00e5ff]/10 border border-[#00e5ff]/50 text-[#00e5ff]'
                    : 'text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                  }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Toggle & Logout */}
        <div className="p-4 border-t border-[#00e5ff]/20 space-y-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-gray-400 hover:text-white p-2 rounded"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-[#00e5ff] hover:text-[#00e5ff] hover:bg-[#00e5ff]/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-[#1A1A1A] border-b border-[#00e5ff]/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-serif text-3xl font-bold">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
            <div className="text-gray-400 text-sm">
              Admin: {user?.email}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-[#121212] p-8">
          {activeTab === 'overview' && <AdminOverview />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'subscriptions' && <AdminSubscriptions />}
          {activeTab === 'marketing' && (
            <div className="text-gray-400 text-center py-20">
              <Megaphone className="w-16 h-16 mx-auto mb-4 text-[#00e5ff]/20" />
              <h3 className="text-xl text-white mb-2">Marketing Global</h3>
              <p>Gerenciamento de templates e campanhas do sistema em breve.</p>
            </div>
          )}
          {activeTab === 'config' && <AdminConfig />}
          {activeTab === 'logs' && <AdminLogs />}
        </div>
      </div>
    </div>
  );
}
