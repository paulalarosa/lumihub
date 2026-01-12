import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Users, Settings, AlertCircle, LogOut, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRole } from '@/types/database';

import AdminOverview from '@/components/admin/AdminOverview';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminConfig from '@/components/admin/AdminConfig';
import AdminLogs from '@/components/admin/AdminLogs';

type AdminTab = 'overview' | 'users' | 'config' | 'logs';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      checkAdminStatus();
    }
  }, [user, authLoading, navigate]);

  const checkAdminStatus = async () => {
    try {
      // Check if user has admin role in profiles or custom claims
      const { data: profileData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      const userRole = profileData?.role as UserRole | undefined;
      const isAdminUser = userRole === 'admin' || userRole === 'super_admin';

      if (!isAdminUser) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
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
    { id: 'config' as AdminTab, label: 'Configurações', icon: Settings },
    { id: 'logs' as AdminTab, label: 'Logs de Erro', icon: AlertCircle },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-black border-r border-red-900/30 flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-red-900/30">
          <h1 className="text-white font-serif text-2xl font-bold">
            {sidebarOpen ? 'LUMI' : 'L'}
          </h1>
          <p className="text-red-500 text-xs font-semibold">
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
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === item.id
                    ? 'bg-red-900/30 border border-red-500 text-red-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Toggle & Logout */}
        <div className="p-4 border-t border-red-900/30 space-y-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-slate-400 hover:text-white p-2 rounded"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-slate-800 border-b border-slate-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-serif text-3xl font-bold">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
            <div className="text-slate-400 text-sm">
              Admin: {user?.email}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-900 p-8">
          {activeTab === 'overview' && <AdminOverview />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'config' && <AdminConfig />}
          {activeTab === 'logs' && <AdminLogs />}
        </div>
      </div>
    </div>
  );
}
