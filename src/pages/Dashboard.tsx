import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  Shield,
  FolderOpen,
  Sparkles,
  Star,
  CheckCircle2,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { AssistantsPanelCard } from '@/components/dashboard/AssistantsPanelCard';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { getCalendarEvents, GoogleCalendarEvent } from '@/integrations/google/calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, loading } = useAuth();

  // Real data from Supabase / Google
  const [clientsCount, setClientsCount] = useState<number>(0);
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [upcomingEvents, setUpcomingEvents] = useState<GoogleCalendarEvent[] | any[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch real data
  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setDataLoading(true);

        // 1. Check Google Connection
        const { data: { session } } = await supabase.auth.getSession();
        const googleConnected = !!session?.provider_token;
        setIsGoogleConnected(googleConnected);

        // 2. Fetch Events (Google or DB)
        if (googleConnected) {
          const gEvents = await getCalendarEvents();
          // Filter only future events and take top 5
          const futureEvents = gEvents.filter(e => {
            const date = e.start.dateTime || e.start.date;
            return date ? new Date(date) >= new Date() : false;
          }).slice(0, 5);
          setUpcomingEvents(futureEvents);
        } else {
          // Fallback to DB events
          const today = new Date().toISOString().split('T')[0];
          const { data: events } = await supabase
            .from('events')
            .select('*')
            .eq('user_id', user.id)
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(5);
          setUpcomingEvents(events || []);
        }

        // 3. Get clients count
        const { count: clientCount } = await supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (clientCount !== null) setClientsCount(clientCount);

        // 4. Get projects count
        const { count: projectCount } = await supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (projectCount !== null) setProjectsCount(projectCount);

        // 5. Get revenue
        const { data: invoices } = await supabase
          .from('invoices')
          .select('amount')
          .eq('user_id', user.id);
        const payments = invoices || [];
        const total = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        setTotalRevenue(total);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();

    // Subscribe to realtime updates for counts
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-[#00e5ff] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) return null;

  // Check if assistant
  const isAssistant = !!user.user_metadata?.parent_user_id;
  // Note: user_metadata might not be updated immediately after link. 
  // Ideally use profiles table data. But for MVP this is OK if we had synced metadata.
  // Better: we fetched 'profiles' earlier? No we fetched counts.
  // Actually, we should check the profile table for `parent_user_id`.

  // Let's rely on isAdmin for now (which is based on role='admin'). 
  // But wait, owner is role='admin'? No, owner is normal user.
  // Let's fetch profile to be sure.
  const [isOwner, setIsOwner] = useState(true);

  useEffect(() => {
    if (!user) return;
    const checkRole = async () => {
      const { data } = await supabase.from('profiles').select('parent_user_id').eq('id', user.id).single();
      if (data?.parent_user_id) setIsOwner(false);
    };
    checkRole();
  }, [user]);

  const stats = [
    ...(isOwner ? [{
      label: "Faturamento",
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      ctaLabel: "Novo",
      ctaLink: "/projetos"
    }] : []),
    {
      label: "Clientes",
      value: clientsCount.toString(),
      icon: Users,
      ctaLabel: "Adicionar",
      ctaLink: "/clientes"
    },
    {
      label: "Projetos",
      value: projectsCount.toString(),
      icon: FolderOpen,
      ctaLabel: "Criar",
      ctaLink: "/projetos"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#C0C0C0] overflow-hidden selection:bg-[#00e5ff]/30 selection:text-[#00e5ff]">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#00e5ff]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#F5E6D3]/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00e5ff]/20 to-[#00e5ff]/5 border border-[#00e5ff]/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-5 w-5 text-[#00e5ff]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl text-white tracking-tight">LumiHub</h1>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="hidden md:flex text-[#C0C0C0] hover:text-white hover:bg-white/5">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <Link to="/configuracoes">
              <Button variant="ghost" size="icon" className="text-[#C0C0C0] hover:text-white hover:bg-white/5">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-[#C0C0C0] hover:text-white hover:bg-white/5">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 pt-32 pb-20">

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-[#00e5ff] to-transparent" />
            <span className="text-[#00e5ff] text-sm font-medium tracking-wider uppercase">Dashboard</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white leading-tight mb-4">
            Bem-vinda, {user.user_metadata?.full_name?.split(' ')[0] || 'Maquiadora'}
          </h1>
          <p className="text-[#C0C0C0]/80 text-lg max-w-xl font-light">
            Seu studio digital está pronto. Aqui está o resumo das suas atividades hoje.
          </p>
        </motion.div>

        {/* Copy Link Card */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-[#00e5ff]/10 to-transparent border border-[#00e5ff]/20">
            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20">
                  <Sparkles className="h-6 w-6 text-[#00e5ff]" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">Seu Link de Agendamento</h3>
                  <p className="text-[#C0C0C0]/60 max-w-lg">
                    Compartilhe este link em sua bio do Instagram ou WhatsApp para que clientes agendem sozinhos.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto bg-black/40 p-1.5 rounded-xl border border-white/5 pl-4">
                <span className="text-sm text-gray-400 truncate flex-1 md:w-auto">
                  lumihub.app/b/{user.user_metadata?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'seu-link'}
                </span>
                <Button
                  size="sm"
                  className="bg-[#00e5ff] hover:bg-[#00e5ff]/80 text-black font-medium"
                  onClick={() => {
                    const slug = user.user_metadata?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'seu-link';
                    navigator.clipboard.writeText(`${window.location.origin}/b/${slug}`);
                    // We don't have access to toast here easily unless we fetch it, wait...
                    // We can import useToast at top if needed, but for now let's just copy.
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Nav Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Clientes', icon: Users, path: '/clientes', color: 'text-blue-400' },
            { label: 'Projetos', icon: FolderOpen, path: '/projetos', color: 'text-purple-400' },
            { label: 'Agenda', icon: Calendar, path: '/agenda', color: 'text-emerald-400' },
            { label: 'Configurações', icon: Settings, path: '/configuracoes', color: 'text-orange-400' },
          ].map((item, i) => (
            <Link key={i} to={item.path}>
              <motion.div
                whileHover={{ y: -5 }}
                className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
              >
                <item.icon className={`h-8 w-8 ${item.color} mb-4 opacity-80 group-hover:opacity-100 transition-opacity`} />
                <span className="text-white font-medium">{item.label}</span>
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-white/50" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Stats & Agenda Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 backdrop-blur-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-white/5">
                      <stat.icon className="h-5 w-5 text-[#00e5ff]" />
                    </div>
                    {stat.ctaLink && (
                      <Link to={stat.ctaLink}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-white/50 hover:text-white hover:bg-white/5">
                          {stat.ctaLabel}
                        </Button>
                      </Link>
                    )}
                  </div>
                  <h3 className="text-3xl font-serif text-white mb-1">{stat.value}</h3>
                  <p className="text-sm text-[#C0C0C0]/60">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Upcoming Events */}
            <Card className="border-0 bg-transparent shadow-none">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl text-white mb-2 flex items-center gap-3">
                    Agenda
                    {isGoogleConnected ? (
                      <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400 gap-1.5 py-1 px-3">
                        <CheckCircle2 className="w-3 h-3" />
                        Sincronizada
                      </Badge>
                    ) : (
                      <Link to="/configuracoes">
                        <Badge variant="outline" className="border-[#00e5ff]/30 bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20 cursor-pointer transition-colors gap-1.5 py-1 px-3">
                          Conectar
                        </Badge>
                      </Link>
                    )}
                  </h2>
                </div>
                <Link to="/agenda" className="text-sm text-[#00e5ff] hover:text-[#00e5ff]/80 transition-colors flex items-center gap-1">
                  Ver completa <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event: any, i) => {
                    // Normalize Google Event vs DB Event
                    const isGoogle = !!event.summary;
                    const title = isGoogle ? event.summary : event.title;
                    const start = isGoogle ? (event.start.dateTime || event.start.date) : (event.event_date + 'T' + event.start_time);
                    const dateObj = new Date(start);
                    const day = dateObj.getDate();
                    const month = format(dateObj, 'MMM', { locale: ptBR });
                    const time = format(dateObj, 'HH:mm');

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                      >
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-white/5 border border-white/5 text-center">
                          <span className="text-xs text-white/50 uppercase">{month}</span>
                          <span className="text-xl font-serif text-white">{day}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1 group-hover:text-[#00e5ff] transition-colors">{title}</h4>
                          <p className="text-sm text-white/40 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {time} • {isGoogle ? 'Google Calendar' : 'Local'}
                          </p>
                        </div>
                        {isGoogle && (
                          <a href={event.htmlLink} target="_blank" rel="noreferrer">
                            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-4 h-4 text-white/60" />
                            </Button>
                          </a>
                        )}
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/[0.02] border border-white/5 border-dashed">
                    <Calendar className="w-10 h-10 text-white/20 mb-3" />
                    <p className="text-white/40 mb-4">Nenhum compromisso próximo</p>
                    <Link to="/agenda">
                      <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 hover:text-[#00e5ff]">
                        + Novo Evento
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Assistants */}
          <div>
            <Card className="h-full border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#00e5ff]" />
                  Equipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AssistantsPanelCard />
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}