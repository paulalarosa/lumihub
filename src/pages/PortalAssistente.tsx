import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2,
  Terminal,
  MapPin,
  Clock,
  CreditCard,
  CheckSquare,
  Calendar as CalendarIcon,
  Activity,
  ShieldAlert,
  ChevronRight,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import AssistantAgenda from "@/components/assistant-portal/AssistantAgenda";
import AssistantTasks from "@/components/assistant-portal/AssistantTasks";
import PremiumFeatureModal from "@/components/assistant-portal/PremiumFeatureModal";

type TabType = "dashboard" | "agenda" | "tarefas" | "financeiro";

const PortalAssistente = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [assistant, setAssistant] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState("");

  // Mock earnings Data (In production this would come from the database)
  const earningsData = {
    thisMonth: 2850.00,
    lastMonth: 2200.00,
    totalEarned: 15250.00,
    targetThisMonth: 4000.00
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAssistantData();
    }
  }, [user]);

  useEffect(() => {
    if (assistant) {
      fetchEvents();

      const channel = supabase
        .channel('assistant_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'assistant_notifications',
            filter: `assistant_id=eq.${assistant.id}`,
          },
          (payload) => {
            if (payload.new.type === 'event_assigned') {
              fetchEvents();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [assistant, currentMonth]);

  const fetchAssistantData = async () => {
    if (!user) return;

    try {
      const { data: assistantData } = await supabase
        .from("assistants")
        .select("*, user_id")
        .eq("assistant_user_id", user.id)
        .maybeSingle();

      if (!assistantData) {
        setLoading(false);
        return;
      }

      setAssistant(assistantData);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", assistantData.user_id)
        .single();

      const { data: settingsData } = await supabase
        .from("professional_settings")
        .select("phone")
        .eq("user_id", assistantData.user_id)
        .single();

      setProfessional({
        name: profileData?.full_name || "Profissional",
        phone: settingsData?.phone
      });

      const { data: assignedEvents } = await supabase
        .from("event_assistants")
        .select("event_id")
        .eq("assistant_id", assistantData.id);

      if (assignedEvents && assignedEvents.length > 0) {
        const eventIds = assignedEvents.map(e => e.event_id);
        const { data: eventsWithProjects } = await supabase
          .from("events")
          .select("project_id")
          .in("id", eventIds)
          .not("project_id", "is", null);

        if (eventsWithProjects && eventsWithProjects.length > 0) {
          const projectIds = [...new Set(eventsWithProjects.map(e => e.project_id).filter(Boolean))];
          const { data: tasksData } = await supabase
            .from("tasks")
            .select("*, projects(name)")
            .in("project_id", projectIds)
            .in("visibility", ["assistant", "client"])
            .order("due_date", { ascending: true, nullsFirst: false });

          setTasks(tasksData || []);
        }
      }
    } catch (error) {
      console.error("Error fetching assistant data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!assistant) return;
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data: eventAssignments } = await supabase
      .from("event_assistants")
      .select("event_id")
      .eq("assistant_id", assistant.id);

    if (!eventAssignments?.length) {
      setEvents([]);
      return;
    }

    const eventIds = eventAssignments.map((ea) => ea.event_id);
    const { data: eventsData } = await supabase
      .from("events")
      .select("*, clients(name), projects(name)")
      .in("id", eventIds)
      .gte("event_date", format(start, "yyyy-MM-dd"))
      .lte("event_date", format(end, "yyyy-MM-dd"))
      .order("event_date", { ascending: true });

    setEvents(eventsData || []);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const upcomingEvents = events
    .filter((e) => {
      const eventDate = parseISO(e.event_date);
      return eventDate >= new Date(new Date().setHours(0, 0, 0, 0));
    })
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  const nextEvent = upcomingEvents[0];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user || !assistant) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-white/20 p-12 text-center bg-black">
          <ShieldAlert className="h-12 w-12 mx-auto text-white/50 mb-6" />
          <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-2">ACCESS_DENIED</h2>
          <p className="text-white/60 mb-8 font-mono text-xs uppercase tracking-widest leading-relaxed">
            IDENTITY_VERIFICATION_FAILED. CONTACT_ADMIN.
          </p>
          <Button variant="outline" onClick={handleLogout} className="rounded-none w-full border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest h-12">
            TERMINATE_SESSION
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-white selection:text-black pb-24">

      {/* 1. Header / Status Bar */}
      <header className="fixed top-0 left-0 right-0 bg-[#050505] border-b border-neutral-800 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {/* Monochrome Pulse */}
              <div className="w-1.5 h-1.5 bg-white animate-pulse rounded-full"></div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">SYSTEM_ONLINE</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="rounded-none text-neutral-500 hover:text-white hover:bg-transparent font-mono text-[10px] uppercase tracking-widest"
          >
            [ LOGOUT ]
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24">

        {/* UPSELL BANNER - THE EMPIRE TRAP */}
        <div className="mb-12 border border-white p-8 bg-black relative overflow-hidden group">
          {/* Diagonal Stripes Background Effect */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 12px)' }}></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Lock className="w-4 h-4 text-white" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Backstage Access</p>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif text-white uppercase tracking-wider mb-2">
                VOCÊ ESTÁ NO BACKSTAGE.
              </h2>
              <p className="text-xs text-neutral-400 font-mono uppercase tracking-widest max-w-md">
                Pronta para construir seu próprio império? Tenha sua agenda, clientes e contratos.
              </p>
            </div>
            <Button
              onClick={() => { setSelectedFeature("Upgrade Full"); setPremiumModalOpen(true); }}
              className="bg-white text-black hover:bg-neutral-200 rounded-none h-12 px-8 font-bold uppercase tracking-[0.2em] text-xs border border-transparent transition-all hover:scale-105"
            >
              CRIAR MEU IMPÉRIO
            </Button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Status Report */}
            <div>
              <p className="text-[10px] text-neutral-600 uppercase tracking-[0.3em] mb-2">/// CURRENT_TIMESTAMP</p>
              <h1 className="text-5xl font-serif text-white tracking-widest uppercase">
                {format(new Date(), "HH:mm")}
              </h1>
              <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest mt-2 border-l border-neutral-800 pl-3">
                {format(new Date(), "dd.MM.yyyy", { locale: ptBR })} • UTC-3
              </p>
            </div>

            {/* Next Mission */}
            <section>
              <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2">
                <h2 className="text-xs text-white font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity className="h-3 w-3" /> NEXT_MISSION_DATA
                </h2>
                {nextEvent && <span className="text-[9px] text-white bg-neutral-900 border border-neutral-800 px-2 py-1 uppercase tracking-widest">CONFIRMED</span>}
              </div>

              {nextEvent ? (
                <Card className="bg-black text-white border border-neutral-800 rounded-none overflow-hidden relative group hover:border-neutral-600 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <MapPin className="h-32 w-32 translate-x-10 -translate-y-10" />
                  </div>
                  <CardContent className="p-8 relative z-10">
                    <div className="space-y-8">
                      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 border-b border-white/10 pb-6">
                        <div>
                          <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-1">PROJECT</p>
                          <h3 className="text-lg font-bold tracking-wide">{nextEvent.projects?.name || 'PRIVATE_EVENT'}</h3>
                          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">{nextEvent.title}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-1">DATE</p>
                          <p className="text-lg font-serif">
                            {format(parseISO(nextEvent.event_date), "dd . MM . yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-2">CALL_TIME</p>
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-white" />
                            <span className="text-2xl font-light">{nextEvent.start_time?.substring(0, 5) || "TBA"}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-2">LOCATION</p>
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-white" />
                            <span className="text-sm font-bold uppercase truncate max-w-[150px]">
                              {nextEvent.location || "TBA"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full bg-white text-black hover:bg-neutral-200 rounded-none font-bold uppercase text-[10px] tracking-[0.2em] h-12 mt-4">
                        Details & Check-in
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="border border-neutral-800 bg-neutral-900/20 p-12 text-center rounded-none">
                  <p className="text-neutral-500 font-mono text-xs uppercase tracking-[0.2em]">NO_PENDING_MISSIONS</p>
                  <p className="text-[9px] text-neutral-700 font-mono uppercase mt-2">STANDBY_MODE_ENGAGED</p>
                </div>
              )}
            </section>

            {/* Financial Intel */}
            <section className="space-y-6">
              <h2 className="text-xs text-white font-bold uppercase tracking-[0.2em] flex items-center gap-2 border-b border-neutral-800 pb-2">
                <CreditCard className="h-3 w-3" /> FINANCIAL_INTEL
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings Card */}
                <div className="border border-neutral-800 bg-black p-8 relative">
                  <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-4">TOTAL_EARNINGS (YTD)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-neutral-600 text-lg">R$</span>
                    <span className="text-4xl font-light tracking-tight text-white">
                      {earningsData.totalEarned.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-neutral-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest">MONTHLY_TARGET</span>
                      <span className="text-[10px] text-white uppercase tracking-widest">
                        {((earningsData.thisMonth / earningsData.targetThisMonth) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={(earningsData.thisMonth / earningsData.targetThisMonth) * 100} className="h-0.5 rounded-none bg-neutral-800" indicatorClassName="bg-white" />
                  </div>
                </div>

                {/* Stats List */}
                <div className="border border-neutral-800 bg-neutral-900/20 p-8 flex flex-col justify-center gap-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">THIS_MONTH</span>
                    <span className="font-mono text-sm text-white">R$ {earningsData.thisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">LAST_MONTH</span>
                    <span className="font-mono text-sm text-neutral-400">R$ {earningsData.lastMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-2 rounded-none border-neutral-800 text-neutral-400 hover:text-white hover:border-white text-[9px] uppercase tracking-widest h-10">
                    Full Report
                  </Button>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* Other Tabs with Noir Style */}
        {activeTab === 'agenda' && (
          <AssistantAgenda events={events} currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
        )}

        {activeTab === 'tarefas' && (
          <AssistantTasks tasks={tasks} onTaskUpdate={fetchAssistantData} />
        )}

        {activeTab === 'financeiro' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 border border-neutral-800 bg-neutral-900/10 p-12">
            <div className="w-16 h-16 border border-neutral-800 flex items-center justify-center bg-black">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">ACCESS_RESTRICTED</h3>
              <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest max-w-xs mx-auto">
                Full financial breakdowns are reserved for Pro Organization Accounts.
              </p>
            </div>
            <Button onClick={() => { setSelectedFeature("Financeiro"); setPremiumModalOpen(true); }} className="rounded-none bg-white text-black font-bold text-xs uppercase tracking-[0.2em] h-12 px-8 hover:bg-neutral-200">
              Unlock Pro Access
            </Button>
          </div>
        )}

      </main>

      {/* Navigation Bar (Strict Black & White) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-neutral-800 z-50 pb-safe">
        <div className="grid grid-cols-4 h-20">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group
                ${activeTab === 'dashboard' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <Terminal className="h-5 w-5" />
            <span className="text-[8px] font-mono uppercase tracking-[0.2em]">HOME</span>
            {activeTab === 'dashboard' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-white"></div>}
          </button>

          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group
                ${activeTab === 'agenda' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <CalendarIcon className="h-5 w-5" />
            <span className="text-[8px] font-mono uppercase tracking-[0.2em]">PLAN</span>
            {activeTab === 'agenda' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-white"></div>}
          </button>

          <button
            onClick={() => setActiveTab('tarefas')}
            className={`flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group
                ${activeTab === 'tarefas' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <CheckSquare className="h-5 w-5" />
            <span className="text-[8px] font-mono uppercase tracking-[0.2em]">OPS</span>
            {activeTab === 'tarefas' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-white"></div>}
          </button>

          <button
            onClick={() => setActiveTab('financeiro')}
            className={`flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group
                ${activeTab === 'financeiro' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-[8px] font-mono uppercase tracking-[0.2em]">FIN</span>
            {activeTab === 'financeiro' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-white"></div>}
          </button>
        </div>
      </nav>

      <PremiumFeatureModal
        open={premiumModalOpen}
        onOpenChange={setPremiumModalOpen}
        featureName={selectedFeature}
        professionalName={professional?.name || "Profissional"}
        professionalPhone={professional?.phone}
      />
    </div>
  );
};

export default PortalAssistente;
