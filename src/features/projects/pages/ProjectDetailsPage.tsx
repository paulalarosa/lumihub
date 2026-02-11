
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { ProjectService } from '@/services/projectService';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { generateWhatsAppLink } from '@/utils/whatsappGenerator';
import { format } from 'date-fns';
import { useProjectDetails } from '@/features/projects/hooks/useProjectDetails';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, ClipboardList } from 'lucide-react';

// Feature Components
import type { Project, Task, Contract, BriefingUI, BriefingWithContent, BriefingContent, ProjectServiceItem, ProjectWithRelations, Service } from '@/types/api.types';
import { ProjectHeader } from '@/features/projects/components/details/ProjectHeader';
import { ProjectStats } from '@/features/projects/components/details/ProjectStats';
import { ProjectTabs } from '@/features/projects/components/details/ProjectTabs';

import type { Service as ServiceType } from '@/types/api.types'; // Redundant if Service is already imported, checking usage

// Derived Briefing type for UI if needed, or just use BriefingWithContent
// The component expects is_submitted, so we should allow it or derive it.
// However, the state is set from API data. APIs don't return is_submitted.
// We should check where is_submitted is used.


export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { organizationId, loading: orgLoading } = useOrganization();
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: projectDetails, isLoading, refetch } = useProjectDetails(id);
  const project = projectDetails?.project || null;

  // We keep local state for items that might be optimistic or need UI interactions distinct from server state,
  // BUT for modernization we should rely on server state.
  // However, existing structure uses 'tasks' state for optimistic updates.
  // Let's sync state to support existing mutation logic or ideally replace it.
  // For this step, I will simplify by deriving from projectDetails where possible,
  // but some components expect 'setTasks'. 
  // I will KEEP the state variables but initialize/sync them with useEffect to bridge the gap
  // between the new Hook and the old mutation logic, until full mutation refactor.

  const [tasks, setTasks] = useState<Task[]>([]);
  const [briefing, setBriefing] = useState<(BriefingWithContent & { is_submitted: boolean }) | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  /* 
  const [projectDetails, setProjectDetails] = useState<ProjectWithRelations | null>(null); // REMOVED duplicate state 
  */
  const [projectServices, setProjectServices] = useState<ProjectServiceItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]); // Derived from details

  // Sync effect
  useEffect(() => {
    if (projectDetails) {
      setTasks(projectDetails.tasks as Task[]);

      if (projectDetails.briefing) {
        // Map content.questions to briefing.questions if needed
        const rawBriefing = projectDetails.briefing as unknown as BriefingWithContent;
        const content = rawBriefing.content as BriefingContent | null;

        const mappedBriefing = {
          ...rawBriefing,
          questions: rawBriefing.questions || content?.questions || [],
          answers: rawBriefing.answers || content?.answers || {},
          is_submitted: rawBriefing.status === 'submitted' // Derived property
        };
        setBriefing(mappedBriefing);
      }

      setContracts(projectDetails.contracts as Contract[]);

      // Fix ProjectServices mapping
      const mappedProjectServices = (projectDetails.projectServices || []).map(ps => ({
        ...ps,
        quantity: Number(ps.quantity || 1), // Cast to number
        paid_amount: 0, // Column missing in DB
        notes: null, // Column missing in DB
        service: ps.service ? {
          ...ps.service,
          description: ps.service.description || '', // Ensure description exists
          // Service type requires price to be string (if DB says so)
          // If we mistakenly cast to number for UI, we break the Service type contract.
          // Let's keep it as is from DB (string) or ensure it's string.
          // If ps.service.price is number/string, we leave it or Cast to string if needed.
          // But wait, ps.service comes from DB.
          // If we want to assign it to 'service' prop of ProjectServiceItem, it must match Service.
        } : undefined
      }));
      setProjectServices(mappedProjectServices);

      // Fix Services mapping
      const mappedServices = (projectDetails.services || []).map(s => ({
        ...s,
        // price: Number(s.price || 0), // REMOVED cast to number to satisfy Service[] type
        description: s.description || '' // Ensure description
      }));
      setServices(mappedServices);

      setTransactions(projectDetails.transactions || []);
    }
  }, [projectDetails]);

  // Tabs
  const [activeTab, setActiveTab] = useState('tarefas');

  // View mode
  const [viewMode, setViewMode] = useState<'internal' | 'preview'>('internal');

  // Task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  // visibility not supported in DB schema
  // const [newTaskVisibility, setNewTaskVisibility] = useState('private');

  // Service form
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceQuantity, setServiceQuantity] = useState('1');
  const [servicePrice, setServicePrice] = useState('');

  // Payment form
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentServiceId, setPaymentServiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // REMOVED manual fetchData useEffect and fetchData function.
  // We use useProjectDetails hook now.

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('project-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contracts', filter: `project_id=eq.${id}` },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `project_id=eq.${id}` },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetch]);

  const addTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim() || !id || !organizationId) return;

    const { error } = await ProjectService.createTask({
      project_id: id,
      user_id: organizationId,
      title: newTaskTitle.trim(),
      status: 'pending', // Default status
      sort_order: tasks.length
    });

    if (error) {
      toast({ title: "Erro ao adicionar tarefa", variant: "destructive" });
    } else {
      setNewTaskTitle('');
      refetch();
    }
  };

  const toggleTask = async (taskId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const { error } = await ProjectService.updateTask(taskId, { status: newStatus });

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await ProjectService.deleteTask(taskId);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const copyPortalLink = async () => {
    if (!project?.client?.id) {
      toast({ title: "Erro", description: "Cliente não vinculado ao projeto.", variant: "destructive" });
      return;
    }

    try {
      const clientId = project.client.id;

      // 1. Try fetching from wedding_clients (preferred, has access_pin)
      let { data: clientData, error } = await supabase
        .from('wedding_clients')
        .select('access_pin, secret_code')
        .eq('id', clientId)
        .single();

      // 2. If not found or error, try clients view/table
      if (error || !clientData) {
        const { data: genericClient, error: genericError } = await supabase
          .from('clients')
          .select('secret_code') // clients view typically doesn't have access_pin visible?
          .eq('id', clientId)
          .single();

        const typedGenericClient = genericClient as unknown as { secret_code: string } | null;

        if (genericError || !typedGenericClient) {
          throw new Error("Cliente não encontrado em nenhuma tabela.");
        }

        // Ensure secret code exists
        if (!typedGenericClient.secret_code) {
          throw new Error("Cliente sem código de acesso gerado.");
        }

        // Use generic client data
        const link = `${window.location.origin}/portal/${typedGenericClient.secret_code}`;
        await navigator.clipboard.writeText(link);
        setCopied(true);
        toast({ title: "Link copiado!", description: "Link do portal copiado." });
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // 3. Use wedding_clients data
      const { secret_code } = clientData;
      const link = `${window.location.origin}/portal/${secret_code}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({ title: "Link Copiado!", description: `Link enviado para a área de transferência.` });
      setTimeout(() => setCopied(false), 2000);

    } catch (e) {
      console.error("Portal Link Error", e);
      toast({ title: "Erro ao gerar link", variant: "destructive" });
    }
  };

  const handleSendReminder = async () => {
    if (!project || !project.client || !user) return;

    if (!project.client.phone) {
      toast({ title: "Cliente sem telefone cadastrado", variant: "destructive" });
      return;
    }

    try {
      const { data: templateData } = await supabase
        .from('message_templates')
        .select('content')
        .eq('organization_id', organizationId)
        .eq('type', 'reminder_24h')
        .single();

      const textPattern = templateData?.content || "Olá {client_name}, passando para lembrar do seu agendamento dia {date} às {time}.";

      let professionalName = "LumiHub";
      const { data: profData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const profile = profData;
      if (profile?.full_name) professionalName = profile.full_name;

      const eventDateObj = project.event_date ? new Date(project.event_date) : null;
      const dateStr = eventDateObj ? format(eventDateObj, 'dd/MM') : 'Data a definir';
      const timeStr = eventDateObj ? format(eventDateObj, 'HH:mm') : 'Horário a definir';

      const link = generateWhatsAppLink(textPattern, {
        client_name: project.client.full_name || 'Cliente',
        professional_name: professionalName,
        date: dateStr,
        time: timeStr,
        location: project.event_location || "Local a definir",
        phone: project.client.phone
      });

      window.open(link, '_blank');
    } catch (error) {
      console.error("Error generating WhatsApp link:", error);
      toast({ title: "Erro ao gerar link", variant: "destructive" });
    }
  };

  const createDefaultBriefing = async () => {
    if (!id || !organizationId) return;

    const defaultQuestions = [
      { id: '1', question: 'Qual é o seu tipo de pele? (oleosa, seca, mista, normal)', type: 'text' },
      { id: '2', question: 'Você tem alguma alergia a cosméticos?', type: 'text' },
      { id: '3', question: 'Qual estilo de maquiagem você prefere?', type: 'text' },
      { id: '4', question: 'Quais cores você gostaria de usar?', type: 'text' },
      { id: '5', question: 'Você usará cílios postiços?', type: 'text' },
      { id: '6', question: 'Alguma observação adicional?', type: 'text' }
    ];

    const { error } = await ProjectService.createBriefing({
      project_id: id,
      status: 'pending',
      user_id: organizationId,
      content: { questions: defaultQuestions } // Wrap questions in content JSON
    });

    if (!error) {
      toast({ title: "Questionário criado!" });
      refetch();
    }
  };

  const addServiceToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !id || !organizationId) return;

    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return;

    const qty = parseInt(serviceQuantity) || 1;
    // Service price is string in DB, but might be number if not strict. Safe cast.
    const priceStr = service.price ? String(service.price) : '0';
    const price = servicePrice ? parseFloat(servicePrice) : parseFloat(priceStr);
    const total = qty * price;

    const { error } = await ProjectService.addProjectService({
      project_id: id,
      service_id: selectedServiceId,
      quantity: qty.toString(),
      unit_price: price, // defined as number
      total_price: total.toString()
    });

    if (error) {
      toast({ title: "Erro ao adicionar serviço", variant: "destructive" });
    } else {
      toast({ title: "Serviço adicionado!" });
      setIsServiceDialogOpen(false);
      setSelectedServiceId('');
      setServiceQuantity('1');
      setServicePrice('');
      refetch(); // Update services
    }
  };

  const removeServiceFromProject = async (projectServiceId: string) => {
    const { error } = await ProjectService.deleteProjectService(projectServiceId);
    if (!error) {
      toast({ title: "Serviço removido!" });
      if (id) {
        refetch(); // Update services
      }
    }
  };

  const registerPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanAmount = typeof paymentAmount === 'string'
      ? parseFloat(paymentAmount.replace('R$', '').replace('.', '').replace(',', '.'))
      : parseFloat(paymentAmount);

    if (isNaN(cleanAmount)) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }

    if (!id || (!project?.client_id && !project?.client?.id) || !organizationId) {
      toast({ title: "Erro interno", description: "Identificação do projeto ou usuário ausente.", variant: "destructive" });
      return;
    }

    const ps = projectServices.find(s => s.id === paymentServiceId);
    const finalDescription = paymentDescription.trim() || (ps ? `Pagamento: ${ps.service?.name}` : 'Pagamento Geral');

    const payload = {
      project_id: id,
      client_id: project.client_id || project.client?.id,
      amount: cleanAmount,
      description: finalDescription,
      type: 'income',
      status: 'completed',
      user_id: organizationId, // Required by DB
      date: new Date().toISOString(),
      category: 'Projeto'
    };

    const { error: transError } = await supabase.from('transactions').insert([payload]);

    if (transError) {
      toast({ title: "Erro ao registrar transação", description: transError.message, variant: "destructive" });
      return;
    }

    if (ps) {
      const newPaidAmount = (ps.paid_amount || 0) + cleanAmount;
      // paid_amount not in DB schema
      // await ProjectService.updateProjectService(paymentServiceId, { paid_amount: newPaidAmount });
    }

    toast({ title: "Pagamento registrado!" });
    setIsPaymentDialogOpen(false);
    setPaymentServiceId('');
    setPaymentAmount('');
    setPaymentDescription('');
    refetch(); // Refresh financials
  };

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service?.price) {
      setServicePrice(service.price.toString());
    }
  };

  if (authLoading || orgLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!project) return null;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completed = projectServices.reduce((acc, curr) => {
    const quantity = Number(curr.quantity || 0);
    const unitPrice = Number(curr.unit_price || curr.price || 0);
    return acc + (curr.paid_amount || 0);
  }, 0);

  const total = projectServices.reduce((acc, curr) => {
    const quantity = Number(curr.quantity || 0);
    const unitPrice = Number(curr.unit_price || curr.price || 0);
    return acc + (quantity * unitPrice);
  }, 0);
  const totalServiceAmount = total;
  const totalReceived = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPaidAmount = totalReceived;
  const remainingAmount = totalServiceAmount - totalReceived;

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black">
      <ProjectHeader
        project={project}
        viewMode={viewMode}
        setViewMode={setViewMode}
        copyPortalLink={copyPortalLink}
        copied={copied}
        handleSendReminder={handleSendReminder}
        t={t}
      />

      <main className="container mx-auto px-4 py-8">
        {viewMode === 'preview' ? (
          /* PUBLIC PREVIEW - What the client sees */
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6 bg-black border border-white/20 rounded-none">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-white font-serif uppercase tracking-wide">
                  <Eye className="h-5 w-5" />
                  CLIENT_PORTAL_PREVIEW
                </CardTitle>
                <CardDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">
                  SIMULATION_MODE :: VIEW_AS_CLIENT
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="space-y-6">
              {/* Contract Preview */}
              <Card className="bg-black border border-white/20 rounded-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white font-serif uppercase tracking-wide">
                    <FileText className="h-5 w-5" />
                    CONTRACTS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contracts.filter(c => c.status === 'sent' || c.status === 'signed').length === 0 ? (
                    <p className="text-white/40 font-mono text-xs uppercase">NO_CONTRACTS_AVAILABLE</p>
                  ) : (
                    <div className="space-y-3">
                      {contracts.filter(c => c.status === 'sent' || c.status === 'signed').map(contract => (
                        <div key={contract.id} className="p-4 border border-white/10 rounded-none bg-white/5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-white">{contract.title}</span>
                            <Badge variant="outline" className={`rounded-none font-mono text-[9px] uppercase tracking-widest ${contract.status === 'signed' ? 'bg-white text-black border-white' : 'text-white border-white/40'
                              }`}>
                              {contract.status === 'signed' ? 'SIGNED' : 'PENDING'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Briefing Preview */}
              <Card className="bg-black border border-white/20 rounded-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white font-serif uppercase tracking-wide">
                    <ClipboardList className="h-5 w-5" />
                    BRIEFING_DATA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!briefing ? (
                    <p className="text-white/40 font-mono text-xs uppercase">NO_DATA_AVAILABLE</p>
                  ) : (
                    <div className="space-y-4">
                      <Badge variant="outline" className={`rounded-none font-mono text-[9px] uppercase tracking-widest ${briefing.is_submitted ? 'bg-white text-black border-white' : 'text-white border-white/40'
                        }`}>
                        {briefing.is_submitted ? 'COMPLETED' : 'WAITING_INPUT'}
                      </Badge>
                      {briefing.is_submitted && (
                        <div className="space-y-3 mt-4">
                          {(briefing.questions as Array<{ id: string; question: string }>).map((q) => (
                            <div key={q.id} className="text-sm font-mono">
                              <p className="text-white/60 mb-1 uppercase tracking-wide text-xs">{q.question}</p>
                              <p className="text-white border-l border-white/20 pl-3">{briefing.answers[q.id] || '-'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* INTERNAL VIEW - Professional dashboard */
          <>
            <ProjectStats
              completedTasks={completedTasks}
              totalTasks={tasks.length}
              totalServiceAmount={totalServiceAmount}
              totalReceived={totalReceived}
              remainingAmount={remainingAmount}
              t={t}
            />

            <ProjectTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              t={t}
              // Tasks
              tasks={tasks}
              newTaskTitle={newTaskTitle}
              setNewTaskTitle={setNewTaskTitle}
              // Visibility removed
              // newTaskVisibility={newTaskVisibility}
              // setNewTaskVisibility={setNewTaskVisibility}
              addTask={addTask}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              // Briefing
              briefing={briefing}
              createDefaultBriefing={createDefaultBriefing}
              copyPortalLink={copyPortalLink}
              // Contracts
              projectId={id || ''}
              contracts={contracts}
              setContracts={setContracts}
              project={project}
              projectServices={projectServices}
              // Financials
              totalServiceAmount={totalServiceAmount}
              totalPaidAmount={totalPaidAmount}
              services={services}
              isServiceDialogOpen={isServiceDialogOpen}
              setIsServiceDialogOpen={setIsServiceDialogOpen}
              selectedServiceId={selectedServiceId}
              handleSelectService={handleSelectService}
              serviceQuantity={serviceQuantity}
              setServiceQuantity={setServiceQuantity}
              servicePrice={servicePrice}
              setServicePrice={setServicePrice}
              addServiceToProject={addServiceToProject}
              removeServiceFromProject={removeServiceFromProject}
              isPaymentDialogOpen={isPaymentDialogOpen}
              setIsPaymentDialogOpen={setIsPaymentDialogOpen}
              paymentServiceId={paymentServiceId}
              setPaymentServiceId={setPaymentServiceId}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
              paymentDescription={paymentDescription}
              setPaymentDescription={setPaymentDescription}
              registerPayment={registerPayment}
            />
          </>
        )}
      </main>
    </div>
  );
}
