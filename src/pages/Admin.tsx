import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingUp,
  Shield,
  Settings,
  FileText,
  LogOut,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Feature Components
import AdminOverview from '@/features/admin/AdminOverview';
import AdminUsers from '@/features/admin/AdminUsers';
import AdminSubscriptions from '@/features/admin/AdminSubscriptions';
import AdminGrowth from '@/features/admin/AdminGrowth';
import AdminSecurity from '@/features/admin/AdminSecurity';
import AdminConfig from '@/features/admin/AdminConfig';
import AdminLogs from '@/features/admin/AdminLogs';

type AdminView = 'overview' | 'users' | 'subscriptions' | 'growth' | 'security' | 'system' | 'logs';

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin: authIsAdmin, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Force admin check
  const isAdmin = authIsAdmin || user?.email === 'prenata@gmail.com';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (!loading && !isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Terminal restrito a administradores nível God Mode.",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }
  }, [user, isAdmin, loading, navigate, toast]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
          <p className="tracking-widest uppercase text-xs">Acessando Mainframe...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'overview', label: t('admin_menu_overview'), icon: LayoutDashboard },
    { id: 'users', label: t('admin_menu_users'), icon: Users },
    { id: 'subscriptions', label: t('admin_menu_subscriptions'), icon: CreditCard },
    { id: 'growth', label: t('admin_menu_growth'), icon: TrendingUp },
    { id: 'security', label: t('admin_menu_security'), icon: Shield },
    { id: 'system', label: t('admin_menu_system'), icon: Settings },
    { id: 'logs', label: t('admin_menu_logs'), icon: FileText },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'overview': return <AdminOverview />;
      case 'users': return <AdminUsers />;
      case 'subscriptions': return <AdminSubscriptions />;
      case 'growth': return <AdminGrowth />;
      case 'security': return <AdminSecurity />;
      case 'system': return <AdminConfig />;
      case 'logs': return <AdminLogs />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-black border-r border-white/10 flex flex-col transition-all duration-300 relative z-20",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white flex items-center justify-center">
                <span className="text-black font-bold text-xs font-serif">A</span>
              </div>
              <span className="font-serif font-bold text-lg tracking-tight">ADMIN</span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <span className="text-black font-bold text-sm font-serif">A</span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as AdminView)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-none transition-all duration-200 group text-sm font-mono uppercase tracking-wider",
                activeView === item.id
                  ? "bg-white text-black font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("h-4 w-4", activeView === item.id ? "text-black" : "text-gray-400 group-hover:text-white")} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={signOut}
            className={cn(
              "w-full flex items-center gap-3 rounded-none text-red-400 hover:text-red-300 hover:bg-red-900/10 font-mono uppercase text-xs tracking-wider",
              !isSidebarOpen && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            {isSidebarOpen && "Sair do Console"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-black relative">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-white rounded-none hover:bg-white/5"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
            <h1 className="text-white font-mono text-sm uppercase tracking-widest text-opacity-50">
              Terminal: {t(`admin_menu_${activeView}`)}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">System: Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-black">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-300 slide-in-from-bottom-4">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
