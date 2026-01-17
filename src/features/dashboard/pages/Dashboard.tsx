
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
          className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full"
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
    <div className="min-h-screen bg-[#000000] text-white overflow-hidden selection:bg-white selection:text-black">

      {/* Background Ambience - Minimal Noise */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-noise opacity-50" />

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8">

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="h-[1px] w-12 bg-white/20" />
            <span className="font-mono uppercase tracking-[0.3em] text-gray-500 text-xs">Control Center</span>
          </div>
          <h1 className="font-serif text-5xl tracking-tight text-white mb-4">
            Bem-vinda, <br />
            {user.user_metadata?.full_name?.split(' ')[0] || 'Maquiadora'}
          </h1>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 auto-rows-[minmax(180px,auto)]">

          {/* 1. Metric Cards (Top Row) */}
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="col-span-1 md:col-span-2 lg:col-span-2 lumi-card p-6 border border-white/20 relative overflow-hidden group hover:bg-white hover:text-black transition-colors duration-300 rounded-none"
            >
              <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <stat.icon className="w-6 h-6 text-white group-hover:text-black" />
              </div>
              <div className="mt-8">
                <h3 className="font-mono text-3xl md:text-4xl text-white group-hover:text-black font-light tracking-tighter">{stat.value}</h3>
                <p className="text-xs text-white/40 group-hover:text-black/60 uppercase tracking-widest mt-2">{stat.label}</p>
              </div>
              {(stat as any).description && (
                <div className="mt-4 pt-4 border-t border-white/10 group-hover:border-black/10">
                  <p className="font-mono text-xs text-white/60 group-hover:text-black/60">{(stat as any).description}</p>
                </div>
              )}
              <Link to={stat.ctaLink} className="absolute bottom-6 right-6">
                <Button className="bg-white text-black rounded-none hover:bg-gray-200 text-xs uppercase tracking-widest px-4 h-8 group-hover:bg-black group-hover:text-white transition-colors">
                  {stat.ctaLabel}
                </Button>
              </Link>
            </motion.div>
          ))}

          {/* 2. Marketing / Actions (Middle Row) */}
          {marketingTriggers.length > 0 && (
            <div className="col-span-1 md:col-span-4 lg:col-span-6 lumi-card p-6 border border-white/20 rounded-none">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-4 h-4 text-white" />
                <h3 className="text-sm font-medium text-white uppercase tracking-wider">Insights</h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {marketingTriggers.map((trigger, idx) => (
                  <div key={idx} className="flex-shrink-0 min-w-[200px] p-4 border border-white/10 hover:border-white transition-colors">
                    <p className="text-white text-sm font-medium">{trigger.clientName}</p>
                    <p className="text-xs text-white/50">{trigger.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Quick Nav (Vertical / Small) */}
          <div className="col-span-1 md:col-span-4 lg:col-span-2 row-span-2 lumi-card p-6 border border-white/20 rounded-none flex flex-col justify-center gap-4">
            {[
              { label: 'Clientes', icon: Users, path: '/clientes' },
              { label: 'Projetos', icon: FolderOpen, path: '/projetos' },
              { label: 'Agenda', icon: Calendar, path: '/agenda' },
              { label: 'Config', icon: Settings, path: '/configuracoes' },
            ].map((item, i) => (
              <Link key={i} to={item.path}>
                <div className="flex items-center justify-between p-4 border border-white/5 hover:border-white hover:bg-white hover:text-black transition-all group">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-white/50 group-hover:text-black transition-colors" />
                    <span className="text-sm text-white/80 group-hover:text-black font-mono uppercase text-xs tracking-wider">{item.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-black group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {/* 4. Upcoming Events (Large Block) */}
          <div className="col-span-1 md:col-span-4 lg:col-span-4 row-span-2 lumi-card p-6 border border-white/20 rounded-none h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white tracking-wide">Agenda</h3>
              <Link to="/agenda" className="text-xs font-mono text-white/60 hover:text-white uppercase border-b border-transparent hover:border-white transition-all">VER TODA</Link>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin max-h-[400px]">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event: any, i: number) => {
                  const isGoogle = !!event.summary;
                  const title = isGoogle ? event.summary : event.title;
                  // FIX: Safer Date Parsing
                  let start = new Date().toISOString();
                  if (isGoogle) {
                    start = event.start.dateTime || event.start.date;
                  } else if (event.event_date) {
                    start = event.event_date + (event.start_time ? ('T' + event.start_time) : '');
                  }

                  const dateObj = new Date(start);
                  // Fallback if date is invalid
                  const isValidDate = !isNaN(dateObj.getTime());
                  const day = isValidDate ? dateObj.getDate() : '--';
                  const month = isValidDate ? format(dateObj, 'MMM', { locale: ptBR }) : '';
                  const time = isValidDate ? format(dateObj, 'HH:mm') : '';

                  return (
                    <div key={i} className="flex items-center gap-4 p-4 border border-white/10 hover:border-white transition-colors group">
                      <div className="text-center w-12 pt-1 border-r border-white/10 group-hover:border-white/20 pr-4">
                        <span className="block text-[10px] text-white/40 group-hover:text-white/60 uppercase">{month}</span>
                        <span className="block text-xl font-mono text-white group-hover:text-white">{day}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm text-white font-medium truncate group-hover:underline decoration-1 underline-offset-4">{title}</h4>
                        <p className="text-xs text-white/40 font-mono mt-0.5">{time}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/30">
                  <Calendar className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">Sem eventos próximos</p>
                </div>
              )}
            </div>
          </div>

          {/* 5. Team (Conditional) */}
          <div className="col-span-1 md:col-span-4 lg:col-span-6 lumi-card p-6 border border-white/20 rounded-none">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-4 h-4 text-white" />
              <h3 className="text-sm font-medium text-white uppercase tracking-wider">Equipe</h3>
            </div>
            <AssistantsPanelCard />
          </div>

        </div>
      </main>
    </div>
  );
}