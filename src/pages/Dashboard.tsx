import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Shield,
  FolderOpen,
  Plus,
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AssistantsPanelCard } from '@/components/dashboard/AssistantsPanelCard';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isAssistant, signOut, loading } = useAuth();
  
  // Real data from Supabase
  const [clientsCount, setClientsCount] = useState<number>(0);
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && user && isAssistant && !isAdmin) {
      navigate('/assistente');
    }
  }, [user, loading, isAssistant, isAdmin, navigate]);

  // Fetch real data from Supabase
  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardData = async () => {
      try {
        setDataLoading(true);
        
        // Get clients count
        const { count: clientCount, error: clientError } = await supabase
          .from('clientes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (!clientError && clientCount !== null) setClientsCount(clientCount);
        
        // Get projects count
        const { count: projectCount, error: projectError } = await supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (!projectError && projectCount !== null) setProjectsCount(projectCount);
        
        // Get total revenue from payments
        const { data: payments, error: revenueError } = await supabase
          .from('payments')
          .select('amount')
          .eq('user_id', user.id)
          .eq('status', 'completed');
        
        if (!revenueError && payments) {
          const total = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          setTotalRevenue(total);
        }
        
        // Get upcoming events
        const today = new Date().toISOString().split('T')[0];
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('id, title, event_date, start_time, location')
          .eq('user_id', user.id)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5);
        
        if (!eventsError && events) setUpcomingEvents(events);
        
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();

    // Subscribe to realtime updates
    const clientsSubscription = supabase
      .channel('clientes-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'clientes', filter: `user_id=eq.${user.id}` },
        () => fetchDashboardData()
      )
      .subscribe();

    const projectsSubscription = supabase
      .channel('projects-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${user.id}` },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(clientsSubscription);
      supabase.removeChannel(projectsSubscription);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) return null;

  // Metrics with real data
  const stats = [
    {
      label: "Faturamento Total",
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      emptyValue: "R$ 0",
      icon: DollarSign,
      isEmpty: totalRevenue === 0,
      ctaLabel: "Novo Pagamento",
      ctaLink: "/projetos"
    },
    {
      label: "Clientes",
      value: clientsCount.toString(),
      emptyValue: "0",
      icon: Users,
      isEmpty: clientsCount === 0,
      ctaLabel: "Adicionar Cliente",
      ctaLink: "/clientes"
    },
    {
      label: "Projetos",
      value: projectsCount.toString(),
      emptyValue: "0",
      icon: FolderOpen,
      isEmpty: projectsCount === 0,
      ctaLabel: "Novo Projeto",
      ctaLink: "/projetos"
    }
  ];

  return (
    <div data-theme="light" className="min-h-screen bg-background overflow-hidden">
      {/* Header Ultra Luxury */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="border-b border-border/20 bg-background/80 backdrop-blur-2xl sticky top-0 z-50"
      >
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-4 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-12 h-12 bg-gradient-to-br from-primary via-accent to-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20"
              >
                <Sparkles className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="lumi-title text-3xl text-foreground">Lumi</h1>
                <p className="text-xs text-muted-foreground -mt-1">Studio 2026</p>
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              {isAdmin && (
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="glass-button gap-2 border-primary/30">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link to="/configuracoes">
                  <Button variant="ghost" size="icon" className="glass-button">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="glass-button">
                  <LogOut className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Bento Grid Adaptativa de Luxo */}
      <main className="container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10">
              <Star className="h-10 w-10 text-primary" />
            </div>
          </motion.div>
          <h1 className="lumi-title text-5xl text-foreground mb-4">
            Bem-vinda, {user.user_metadata?.full_name || 'Maquiadora'}
          </h1>
          <p className="lumi-text text-xl text-muted-foreground max-w-2xl mx-auto">
            Seu painel de controle inteligente. Dados em tempo real para decisões estratégicas.
          </p>
        </motion.div>

        {/* Quick Navigation - 4 Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { icon: Users, label: "Clientes", to: "/clientes", color: "from-blue-400/20 to-cyan-400/20" },
            { icon: FolderOpen, label: "Projetos", to: "/projetos", color: "from-purple-400/20 to-pink-400/20" },
            { icon: Calendar, label: "Agenda", to: "/agenda", color: "from-emerald-400/20 to-teal-400/20" },
            { icon: Settings, label: "Configurações", to: "/configuracoes", color: "from-orange-400/20 to-red-400/20" }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="quick-nav-card"
            >
              <Link to={item.to}>
                <div className={`quick-nav-card-inner bg-gradient-to-br ${item.color}`}>
                  <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-[hsl(var(--muted-foreground))] icon-thin" />
                  </div>
                  <span className="lumi-label">{item.label}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Metrics Grid - 4 Blocos com Empty States */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className="metric-card"
            >
              <div className="mb-4">
                <stat.icon className="h-5 w-5 text-[hsl(var(--muted-foreground))] icon-thin" />
              </div>
              
              {stat.isEmpty ? (
                <div className="space-y-3">
                  <div className="metric-value text-[hsl(var(--muted-foreground))]">
                    {stat.emptyValue || '0'}
                  </div>
                  <div className="metric-label mb-3">{stat.label}</div>
                  <Link to={stat.ctaLink || '#'}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full glass-button border-primary/30 text-xs"
                    >
                      + {stat.ctaLabel}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="metric-value">{stat.value}</div>
                  <div className="metric-label">{stat.label}</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Additional Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="lumi-card h-full flex flex-col">
              <CardHeader>
                <CardTitle className="lumi-title text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximos Compromissos
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto scrollbar-thin">
                {upcomingEvents.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center py-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <p className="lumi-text text-sm text-[hsl(var(--muted-foreground))] mb-4">
                      Nenhum compromisso agendado
                    </p>
                    <Link to="/agenda">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="glass-button border-primary/30"
                      >
                        + Agendar
                      </Button>
                    </Link>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map((event, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 rounded-xl bg-[hsl(var(--muted))] border border-[rgba(255,255,255,0.05)] hover:bg-[hsl(var(--muted))]/80 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="lumi-text font-medium text-sm">{event.title}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{event.location}</p>
                          </div>
                          <span className="lumi-label">{event.time}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Assistants Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="lumi-card h-full flex flex-col">
              <CardHeader>
                <CardTitle className="lumi-title text-xl flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Minhas Assistentes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto scrollbar-thin">
                <AssistantsPanelCard />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}