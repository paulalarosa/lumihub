import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfMonth, endOfMonth, format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2,
  Terminal,
  MapPin,
  Clock,
  CreditCard,
  CheckSquare,
  LogOut,
  Calendar as CalendarIcon,
  Activity,
  ShieldAlert,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  // Mock earnings data (in production, fetch real data)
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

      // Real-time subscription for new assignments
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

      // Get professional info
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

      // Fetch tasks logic (simplified reuse)
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

  // Find next upcoming event
  const upcomingEvents = events
    .filter((e) => {
      const eventDate = parseISO(e.event_date);
      // Include today and future events
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
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-white/20 p-8 text-center bg-black">
          <ShieldAlert className="h-12 w-12 mx-auto text-white/50 mb-4" />
          <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-2">ACCESS_DENIED</h2>
          <p className="text-white/60 mb-6 font-mono text-xs uppercase tracking-widest leading-relaxed">
            IDENTITY_VERIFICATION_FAILED. CONTACT_ADMIN.
          </p>
          <Button variant="outline" onClick={handleLogout} className="rounded-none w-full border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest">
            TERMINATE_SESSION
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black pb-24">
      {/* 1. Technical Status Bar Header */}
      <header className="fixed top-0 left-0 right-0 bg-black border-b border-white/20 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full"></div>
              <span className="text-[10px] text-white/50 uppercase tracking-[0.2em]">SYSTEM_ONLINE</span>
            </div>
            <div className="text-xs font-bold text-white uppercase tracking-widest mt-1">
              OPERATIVE: {assistant.name.split(' ')[0]}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="rounded-none text-white/50 hover:text-white hover:bg-transparent font-mono text-[10px] uppercase tracking-widest"
          >
            [ LOGOUT ]
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 pt-24">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 2. Status Report Section */}
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] mb-2">/// CURRENT_TIMESTAMP</p>
              <h1 className="text-3xl font-serif text-white tracking-widest uppercase">
                {format(new Date(), "HH:mm")} <span className="text-white/30 text-lg align-top font-mono">UTC-3</span>
              </h1>
              <p className="text-xs text-white/60 font-mono uppercase tracking-widest mt-1">
                {format(new Date(), "dd.MM.yyyy", { locale: ptBR })}
              </p>
            </div>

            {/* 3. Next Mission Card (High Contrast) */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm text-white font-mono uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4 w-4" /> NEXT_MISSION_DATA
                </h2>
                {nextEvent && <span className="text-[10px] text-green-500 font-mono uppercase tracking-wide border border-green-500/30 px-2 py-0.5">CONFIRMED</span>}
              </div>

              {nextEvent ? (
                <Card className="bg-white text-black border-none rounded-none overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <MapPin className="h-24 w-24 translate-x-8 -translate-y-8" />
                  </div>
                  <CardContent className="p-6 relative z-10">
                    <div className="space-y-6">
                      <div className="flex justify-between items-start border-b border-black/10 pb-4">
                        <div>
                          <p className="text-[10px] text-black/50 uppercase tracking-[0.2em] font-mono mb-1">MISSION_ID</p>
                          <p className="text-black font-mono font-bold text-sm">#{nextEvent.id.substring(0, 6).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-black/50 uppercase tracking-[0.2em] font-mono mb-1">DATE</p>
                          <p className="text-black font-mono font-bold text-sm">
                            {format(parseISO(nextEvent.event_date), "dd.MM.yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-black/50 uppercase tracking-[0.2em] font-mono mb-1">TIME_WINDOW</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="text-xl font-bold tracking-tighter">{nextEvent.start_time?.substring(0, 5) || "08:00"}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-black/50 uppercase tracking-[0.2em] font-mono mb-1">ROLE</p>
                          <span className="text-sm font-bold tracking-wide uppercase">ASSISTANT</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-black/50 uppercase tracking-[0.2em] font-mono mb-1">TARGET_LOCATION</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm font-bold tracking-wide uppercase truncate max-w-full block">
                            {nextEvent.location || "LOCATION_PENDING"}
                          </span>
                        </div>
                      </div>

                      <Button className="w-full bg-black text-white hover:bg-black/90 rounded-none font-mono uppercase text-xs tracking-[0.2em] h-12">
                        ACKNOWLEDGE_RECEIPT
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="border border-white/20 bg-white/5 p-8 text-center rounded-none">
                  <p className="text-white/40 font-mono text-xs uppercase tracking-widest">NO_PENDING_MISSIONS</p>
                  <p className="text-[10px] text-white/30 font-mono uppercase mt-2">STANDBY_MODE_ENGAGED</p>
                </div>
              )}
            </section>

            {/* 4. Financial Display (Raw Data) */}
            <section className="space-y-4">
              <h2 className="text-sm text-white font-mono uppercase tracking-widest flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> FINANCIAL_INTEL
              </h2>

              <div className="border border-white/20 bg-black p-6 rounded-none">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2">TOTAL_EARNINGS (YTD)</p>
                  <div className="text-4xl md:text-5xl font-mono font-thin text-white tracking-tighter">
                    R$ {earningsData.totalEarned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-xs text-white/60 font-mono uppercase tracking-widest">CURRENT_MONTH</span>
                    <span className="text-sm text-white font-mono">
                      R$ {earningsData.thisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-xs text-white/60 font-mono uppercase tracking-widest">LAST_MONTH</span>
                    <span className="text-sm text-white font-mono">
                      R$ {earningsData.lastMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-xs text-white/60 font-mono uppercase tracking-widest">TARGET_PROGRESS</span>
                    <div className="flex items-center gap-3">
                      <Progress value={(earningsData.thisMonth / earningsData.targetThisMonth) * 100} className="w-24 h-1 rounded-none bg-white/10" />
                      <span className="text-[10px] text-white/40 font-mono">
                        {((earningsData.thisMonth / earningsData.targetThisMonth) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Pending Tasks Quick View */}
            <section>
              <h2 className="text-sm text-white font-mono uppercase tracking-widest flex items-center gap-2 mb-4">
                <CheckSquare className="h-4 w-4" /> PENDING_OPERATIONS
              </h2>
              <div className="space-y-1">
                {tasks.filter(t => !t.is_completed).slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="h-2 w-2 bg-white rounded-none animate-pulse" />
                    <span className="text-xs text-white/80 font-mono uppercase truncate flex-1">{task.title}</span>
                    <ChevronRight className="h-3 w-3 text-white/30" />
                  </div>
                ))}
                {tasks.filter(t => !t.is_completed).length === 0 && (
                  <div className="p-4 border border-white/10 text-center text-[10px] text-white/40 font-mono uppercase tracking-widest">
                    ALL_SYSTEMS_CLEAR
                  </div>
                )}
              </div>
            </section>

          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'agenda' && (
          <AssistantAgenda events={events} currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
        )}

        {activeTab === 'tarefas' && (
          <AssistantTasks tasks={tasks} onTaskUpdate={fetchAssistantData} />
        )}

        {activeTab === 'financeiro' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
            <CreditCard className="h-12 w-12 text-white/20" />
            <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
              DETAILED_LEDGER_LOCKED
            </p>
            <Button variant="outline" onClick={() => { setSelectedFeature("Financeiro"); setPremiumModalOpen(true); }} className="rounded-none border-white/20 text-white font-mono text-xs uppercase tracking-widest hover:bg-white hover:text-black">
              REQUEST_ACCESS
            </Button>
          </div>
        )}

      </main>

      {/* Mobile Tab Navigation (Fixed Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/20 z-50 pb-safe">
        <div className="grid grid-cols-4 h-16">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5'}`}
          >
            <Terminal className="h-4 w-4" />
            <span className="text-[9px] font-mono uppercase tracking-widest">TERM</span>
          </button>

          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'agenda' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5'}`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="text-[9px] font-mono uppercase tracking-widest">PLAN</span>
          </button>

          <button
            onClick={() => setActiveTab('tarefas')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'tarefas' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5'}`}
          >
            <CheckSquare className="h-4 w-4" />
            <span className="text-[9px] font-mono uppercase tracking-widest">OPS</span>
          </button>

          <button
            onClick={() => setActiveTab('financeiro')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'financeiro' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5'}`}
          >
            <CreditCard className="h-4 w-4" />
            <span className="text-[9px] font-mono uppercase tracking-widest">FIN</span>
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
