import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfMonth, endOfMonth, format } from "date-fns";
import AssistantHeader from "@/components/assistant-portal/AssistantHeader";
import AssistantSidebar from "@/components/assistant-portal/AssistantSidebar";
import AssistantDashboard from "@/components/assistant-portal/AssistantDashboard";
import AssistantAgenda from "@/components/assistant-portal/AssistantAgenda";
import AssistantTasks from "@/components/assistant-portal/AssistantTasks";
import PremiumFeatureModal from "@/components/assistant-portal/PremiumFeatureModal";
import UpgradeBanner from "@/components/assistant-portal/UpgradeBanner";
import ConfirmationNotification from "@/components/assistant-portal/ConfirmationNotification";
import { Loader2, Menu, User, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type TabType = "dashboard" | "agenda" | "tarefas" | "clientes" | "financeiro" | "relatorios";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");

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
    }
  }, [assistant, currentMonth]);

  // Smart Tagging: Listen for real-time notifications
  useEffect(() => {
    if (!assistant) return;

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
            setConfirmationMessage('Você foi tagged em um novo evento! 🎉');
            setShowConfirmation(true);
            // Refresh events to show the new assignment
            fetchEvents();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assistant]);

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

      // Fetch tasks - get projects from assigned events first
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

  const handleConfirmationComplete = () => {
    setShowConfirmation(false);
    setConfirmationMessage('');
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleLockedClick = (feature: string) => {
    setSelectedFeature(feature);
    setPremiumModalOpen(true);
  };

  const handleContactProfessional = () => {
    if (professional?.phone) {
      const phone = professional.phone.replace(/\D/g, "");
      window.open(`https://wa.me/55${phone}`, "_blank");
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const pendingTasksCount = tasks.filter((t) => !t.is_completed).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Not registered as assistant
  if (!assistant) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">Beauty Pro</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Acesso não autorizado</h2>
              <p className="text-muted-foreground mb-6">
                Você não está registrada como assistente. Entre em contato com a profissional que te convidou.
              </p>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AssistantHeader
        assistantName={assistant?.name || "Assistente"}
        professionalName={professional?.name || "Profissional"}
        onLogout={handleLogout}
      />

      <div className="flex">
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed bottom-20 left-4 z-50 md:hidden h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="pt-12">
              <AssistantSidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                pendingTasksCount={pendingTasksCount}
                onLockedClick={(feature) => {
                  handleLockedClick(feature);
                  setMobileMenuOpen(false);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar */}
        <AssistantSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingTasksCount={pendingTasksCount}
          onLockedClick={handleLockedClick}
        />

        <main className="flex-1 p-4 md:p-6 pb-28">
          {activeTab === "dashboard" && (
            <AssistantDashboard
              events={events}
              tasks={tasks}
              onLockedClick={handleLockedClick}
            />
          )}

          {activeTab === "agenda" && (
            <AssistantAgenda
              events={events}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
            />
          )}

          {activeTab === "tarefas" && (
            <AssistantTasks
              tasks={tasks}
              onTaskUpdate={fetchAssistantData}
            />
          )}
        </main>
      </div>

      <UpgradeBanner
        professionalName={professional?.name || "Profissional"}
        onContactClick={handleContactProfessional}
      />

      <PremiumFeatureModal
        open={premiumModalOpen}
        onOpenChange={setPremiumModalOpen}
        featureName={selectedFeature}
        professionalName={professional?.name || "Profissional"}
        professionalPhone={professional?.phone}
      />

      <ConfirmationNotification
        message={confirmationMessage}
        isVisible={showConfirmation}
        onComplete={handleConfirmationComplete}
      />
    </div>
  );
};

export default PortalAssistente;
