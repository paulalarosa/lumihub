
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
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
  ArrowRight,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { AssistantsPanelCard } from '@/components/dashboard/AssistantsPanelCard';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleCalendarEvent } from '@/integrations/google/calendar';

// Services
import { ClientService } from '@/services/clientService';
import { ProjectService } from '@/services/projectService';
import { RevenueService } from '@/services/revenue.service';
import { EventService } from '@/services/event.service';
import { CommissionLogic } from '@/services/commissionLogic';
import { MarketingLogic, MarketingTrigger } from '@/services/marketingLogic';
import { Gift, AlertCircle, Heart } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Dashboard() {
  /* Full Component Rewrite to safely integrate Financial/Marketing Widgets without messy diffs */
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { organizationId, isOwner, loading: orgLoading } = useOrganization();

  // Real data
  const [clientsCount, setClientsCount] = useState<number>(0);
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalCommissions, setTotalCommissions] = useState<number>(0);
  const [upcomingEvents, setUpcomingEvents] = useState<GoogleCalendarEvent[] | any[]>([]);
  const [marketingTriggers, setMarketingTriggers] = useState<MarketingTrigger[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [originStats, setOriginStats] = useState<{ name: string, value: number }[]>([]);

  // Fetch real data
  useEffect(() => {
    if (!organizationId) return;

    const fetchDashboardData = async () => {
      try {
        setDataLoading(true);

        // 1. Determine Role and Assistant ID
        let currentAssistantId = null;
        if (!isAdmin) {
          const { data: assistant } = await supabase
            .from('assistants')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          currentAssistantId = assistant?.id;
        }

        // 2. Prepare Promises
        const promises: any[] = [
          EventService.getUpcomingEvents(organizationId, user.id, isAdmin ? 'admin' : 'assistant'),
          ClientService.count(organizationId),
          ProjectService.count(organizationId),
        ];

        // 3. Conditional Financials
        if (isAdmin) {
          promises.push(CommissionLogic.getFinancialReport(organizationId));
        } else if (currentAssistantId) {
          promises.push(CommissionLogic.getAssistantCommissions(currentAssistantId));
        } else {
          promises.push(Promise.resolve({ totalRevenue: 0, totalCommissions: 0 }));
        }

        // 4. Marketing & Origin (Admin only)
        if (isAdmin) {
          promises.push(MarketingLogic.getTriggers(organizationId));
          promises.push(ClientService.getOriginStats(organizationId));
        } else {
          promises.push(Promise.resolve([]));
          promises.push(Promise.resolve([]));
        }

        const [
          eventData,
          clientCountVal,
          projectCountVal,
          financialStats,
          marketingData,
          originData
        ] = await Promise.all(promises);

        setUpcomingEvents(eventData.events);
        setIsGoogleConnected(eventData.isGoogleConnected);
        setClientsCount(clientCountVal);
        setProjectsCount(projectCountVal);

        setTotalRevenue(isAdmin ? financialStats.totalRevenue : 0);
        setTotalCommissions(financialStats.totalCommissions); // For assistant, this is their own commission
        setMarketingTriggers(marketingData);
        setOriginStats(originData);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();

    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (orgLoading || dataLoading) {
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

  if (!user || !organizationId) return null;

  const stats = [
    ...(isOwner ? [{
      label: "Faturamento",
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      description: `Comissões: R$ ${totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      ctaLabel: "Detalhes",
      ctaLink: "/admin"
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

        {/* Marketing Triggers Section */}
        {marketingTriggers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-l-4 border-l-[#00e5ff] border-y-0 border-r-0 bg-gradient-to-r from-[#00e5ff]/5 to-transparent shadow-none">
              <div className="p-4 flex items-center gap-4 overflow-x-auto">
                <div className="shrink-0 p-2 bg-[#00e5ff]/10 rounded-full">
                  <Sparkles className="h-5 w-5 text-[#00e5ff]" />
                </div>
                <div className="shrink-0 border-r border-white/10 pr-4 mr-2">
                  <h3 className="text-white font-medium">Marketing Inteligente</h3>
                  <p className="text-xs text-blue-300/80">Oportunidades encontradas</p>
                </div>

                <div className="flex gap-3">
                  {marketingTriggers.map((trigger, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-lg px-3 py-2 shrink-0">
                      <div className={`p-1.5 rounded-full ${trigger.type === 'birthday' ? 'bg-pink-500/20 text-pink-400' :
                        trigger.type === 'anniversary' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                        {trigger.type === 'birthday' ? <Gift className="h-3 w-3" /> :
                          trigger.type === 'anniversary' ? <Heart className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{trigger.clientName}</p>
                        <p className="text-[10px] text-gray-400">{trigger.details}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-full hover:bg-white/10 ml-1">
                        <ArrowRight className="h-3 w-3 text-white/50" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

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

        {/* Charts Section */}
        {isAdmin && originStats.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-[#1A1A1A]/40 backdrop-blur-xl border border-white/5 p-6">
              <h3 className="text-lg font-medium text-white mb-4">Origem das Clientes</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={originStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {originStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#00e5ff', '#a855f7', '#ec4899', '#f97316'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

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
                  {(stat as any).description && (
                    <p className="text-xs text-[#00e5ff]/80 mt-1">{(stat as any).description}</p>
                  )}
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
                  upcomingEvents.map((event: any, i: number) => {
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