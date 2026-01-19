import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Calendar,
  User,
  ExternalLink,
  CheckSquare,
  FileText,
  DollarSign,
  ClipboardList,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  Settings,
  Terminal,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProjectService } from '@/services/projectService';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  name: string;
  event_type: string | null;
  event_date: string | null;
  event_location: string | null;
  status: string;
  public_token: string | null;
  notes: string | null;
  clients: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  visibility: string;
  sort_order: number;
}

interface Briefing {
  id: string;
  questions: any[];
  answers: Record<string, any>;
  is_submitted: boolean;
}

interface Contract {
  id: string;
  title: string;
  content: string;
  status: string;
  signed_at: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
}

interface ProjectServiceItem {
  id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  paid_amount: number;
  notes: string | null;
  service?: Service;
}

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { organizationId, loading: orgLoading } = useOrganization();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projectServices, setProjectServices] = useState<ProjectServiceItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // View mode: internal or public preview
  const [viewMode, setViewMode] = useState<'internal' | 'preview'>('internal');

  // Task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskVisibility, setNewTaskVisibility] = useState('private');

  // Contract form
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [contractTitle, setContractTitle] = useState('');
  const [contractContent, setContractContent] = useState('');

  // Service form
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceQuantity, setServiceQuantity] = useState('1');
  const [servicePrice, setServicePrice] = useState('');

  // Payment form
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentServiceId, setPaymentServiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (organizationId && id) {
      fetchData();
    }
  }, [organizationId, id]);

  const fetchData = async () => {
    if (!id || !organizationId) return;
    setLoadingData(true);

    const { data: projectData, error: projectError } = await ProjectService.get(id);

    if (projectError || !projectData) {
      toast({ title: "Projeto não encontrado", variant: "destructive" });
      navigate('/projetos');
      return;
    }

    const adaptedProject: any = { ...projectData };
    if (adaptedProject.client) {
      adaptedProject.clients = adaptedProject.client;
      delete adaptedProject.client;
    }
    setProject(adaptedProject as Project);

    const { data: tasksData } = await ProjectService.getTasks(id);
    setTasks((tasksData as any) || []);

    const { data: briefingData } = await ProjectService.getBriefing(id);
    if (briefingData) {
      setBriefing({
        ...briefingData,
        questions: briefingData.questions as any[],
        answers: briefingData.answers as Record<string, any>
      } as any);
    }

    const { data: contractsData } = await ProjectService.getContracts(id);
    setContracts((contractsData as any) || []);

    const { data: servicesData } = await ProjectService.getCatalogServices();
    setServices((servicesData as any) || []);

    const { data: projectServicesData } = await ProjectService.getProjectServices(id);
    setProjectServices((projectServicesData as any) || []);

    setLoadingData(false);
  };

  const addTask = async () => {
    if (!newTaskTitle.trim() || !id || !organizationId) return;

    const { error } = await ProjectService.createTask({
      project_id: id,
      user_id: organizationId,
      title: newTaskTitle.trim(),
      visibility: newTaskVisibility,
      sort_order: tasks.length
    });

    if (error) {
      toast({ title: "Erro ao adicionar tarefa", variant: "destructive" });
    } else {
      setNewTaskTitle('');
      const { data } = await ProjectService.getTasks(id);
      setTasks((data as any) || []);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    const { error } = await ProjectService.updateTask(taskId, { is_completed: completed });

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: completed } : t));
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await ProjectService.deleteTask(taskId);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const createContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !organizationId) return;

    const { error } = await ProjectService.createContract({
      project_id: id,
      user_id: organizationId,
      title: contractTitle.trim(),
      content: contractContent.trim(),
      status: 'draft'
    });

    if (error) {
      toast({ title: "Erro ao criar contrato", variant: "destructive" });
    } else {
      toast({ title: "Contrato criado!" });
      setIsContractDialogOpen(false);
      setContractTitle('');
      setContractContent('');
      const { data } = await ProjectService.getContracts(id);
      setContracts((data as any) || []);
    }
  };

  const copyPortalLink = async () => {
    if (!project?.clients?.id) {
      toast({ title: "Erro", description: "Cliente não vinculado ao projeto.", variant: "destructive" });
      return;
    }

    try {
      const clientId = project.clients.id;

      // 1. Ensure PIN (access_pin) exists in wedding_clients
      const { data: client, error: clientError } = await supabase
        .from('wedding_clients')
        .select('access_pin')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      if (!client.access_pin) {
        const newPin = Math.floor(1000 + Math.random() * 9000).toString();
        const { error: updateError } = await supabase
          .from('wedding_clients')
          .update({ access_pin: newPin })
          .eq('id', clientId);

        if (updateError) throw updateError;
        toast({ title: "PIN Gerado", description: `Novo PIN: ${newPin}` });
      }

      // 2. Generate Link directly using ID
      const link = `${window.location.origin}/portal/${clientId}/login`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({ title: "Link Copiado!", description: `Link enviado para a área de transferência.` });
      setTimeout(() => setCopied(false), 2000);

    } catch (e) {
      console.error("Portal Link Error", e);
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
      user_id: organizationId,
      questions: defaultQuestions
    });

    if (!error) {
      toast({ title: "Questionário criado!" });
      const { data } = await ProjectService.getBriefing(id);
      if (data) setBriefing(data as any);
    }
  };

  const addServiceToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !id || !organizationId) return;

    const service = services.find(s => s.id === selectedServiceId);
    if (!service) return;

    const qty = parseInt(serviceQuantity) || 1;
    const price = parseFloat(servicePrice) || (service.price || 0);
    const total = qty * price;

    const { error } = await ProjectService.addProjectService({
      project_id: id,
      service_id: selectedServiceId,
      user_id: organizationId,
      quantity: qty,
      unit_price: price,
      total_price: total
    });

    if (error) {
      toast({ title: "Erro ao adicionar serviço", variant: "destructive" });
    } else {
      toast({ title: "Serviço adicionado!" });
      setIsServiceDialogOpen(false);
      setSelectedServiceId('');
      setServiceQuantity('1');
      setServicePrice('');
      const { data } = await ProjectService.getProjectServices(id);
      setProjectServices((data as any) || []);
    }
  };

  const removeServiceFromProject = async (projectServiceId: string) => {
    const { error } = await ProjectService.deleteProjectService(projectServiceId);

    if (!error) {
      toast({ title: "Serviço removido!" });
      if (id) {
        const { data } = await ProjectService.getProjectServices(id);
        setProjectServices((data as any) || []);
      }
    }
  };

  const registerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentServiceId || !paymentAmount) return;

    const ps = projectServices.find(s => s.id === paymentServiceId);
    if (!ps) return;

    const newPaidAmount = ps.paid_amount + parseFloat(paymentAmount);

    const { error } = await ProjectService.updateProjectService(paymentServiceId, { paid_amount: newPaidAmount });

    if (error) {
      toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
    } else {
      toast({ title: "Pagamento registrado!" });
      setIsPaymentDialogOpen(false);
      setPaymentServiceId('');
      setPaymentAmount('');
      if (id) {
        const { data } = await ProjectService.getProjectServices(id);
        setProjectServices((data as any) || []);
      }
    }
  };

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service?.price) {
      setServicePrice(service.price.toString());
    }
  };

  if (authLoading || orgLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!project) return null;

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const totalServiceAmount = projectServices.reduce((sum, ps) => sum + Number(ps.total_price), 0);
  const totalPaidAmount = projectServices.reduce((sum, ps) => sum + Number(ps.paid_amount), 0);
  const remainingAmount = totalServiceAmount - totalPaidAmount;


  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-white/20 bg-black">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link to="/projetos">
                <Button variant="ghost" size="icon" className="rounded-none text-white hover:bg-white hover:text-black transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-serif font-bold text-2xl text-white uppercase tracking-tighter">
                  {project.name}
                </h1>
                <div className="flex items-center gap-4 text-xs font-mono text-white/60 mt-1 uppercase tracking-widest">
                  {project.clients && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {project.clients.name}
                    </span>
                  )}
                  {project.event_date && (
                    <span className="flex items-center gap-1 border-l border-white/20 pl-4">
                      <Calendar className="h-3 w-3" />
                      {project.event_date ? format(new Date(project.event_date), 'dd/MM/yyyy') : 'TBD'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center border border-white/20 bg-black">
                <Button
                  variant={viewMode === 'internal' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('internal')}
                  className={`rounded-none gap-2 font-mono uppercase text-xs tracking-wider ${viewMode === 'internal' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                >
                  <Settings className="h-3 w-3" />
                  INTERNAL
                </Button>
                <div className="w-[1px] h-4 bg-white/20"></div>
                <Button
                  variant={viewMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('preview')}
                  className={`rounded-none gap-2 font-mono uppercase text-xs tracking-wider ${viewMode === 'preview' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                >
                  <Eye className="h-3 w-3" />
                  PREVIEW
                </Button>
              </div>

              <Button variant="outline" onClick={copyPortalLink} className="gap-2 rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'COPIED' : 'PORTAL_LINK'}
              </Button>
            </div>
          </div>
        </div>
      </header>

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
                          {(briefing.questions as any[]).map((q: any) => (
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
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-black border border-white/20 rounded-none">
                <CardContent className="pt-6">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">TASKS</p>
                  <p className="text-2xl font-serif text-white">{completedTasks}/{tasks.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-black border border-white/20 rounded-none">
                <CardContent className="pt-6">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">TOTAL_VALUE</p>
                  <p className="text-2xl font-serif text-white">R$ {totalServiceAmount.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="bg-black border border-white/20 rounded-none">
                <CardContent className="pt-6">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">RECEIVED</p>
                  <p className="text-2xl font-serif text-white">R$ {totalPaidAmount.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="bg-black border border-white/20 rounded-none">
                <CardContent className="pt-6">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">PENDING</p>
                  <p className="text-2xl font-serif text-white/70 border-b border-white/20 inline-block">R$ {remainingAmount.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="tarefas" className="space-y-6">
              <TabsList className="bg-black border border-white/20 p-0 rounded-none h-12 w-full flex justify-start overflow-x-auto">
                <TabsTrigger value="tarefas" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/60 rounded-none h-full px-6 font-mono text-xs uppercase tracking-widest transition-all">
                  TASKS
                </TabsTrigger>
                <div className="w-[1px] h-full bg-white/20"></div>
                <TabsTrigger value="briefing" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/60 rounded-none h-full px-6 font-mono text-xs uppercase tracking-widest transition-all">
                  BRIEFING
                </TabsTrigger>
                <div className="w-[1px] h-full bg-white/20"></div>
                <TabsTrigger value="contratos" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/60 rounded-none h-full px-6 font-mono text-xs uppercase tracking-widest transition-all">
                  CONTRACTS
                </TabsTrigger>
                <div className="w-[1px] h-full bg-white/20"></div>
                <TabsTrigger value="financeiro" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/60 rounded-none h-full px-6 font-mono text-xs uppercase tracking-widest transition-all">
                  FINANCIAL
                </TabsTrigger>
              </TabsList>

              {/* TAREFAS */}
              <TabsContent value="tarefas">
                <Card className="bg-black border border-white/20 rounded-none">
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-white font-serif uppercase tracking-wide">TASK_MANAGER</CardTitle>
                    <CardDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">OPERATIONAL_CHECKLIST</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex gap-2 mb-6">
                      <Input
                        placeholder="INPUT_NEW_TASK..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                        className="flex-1 bg-black border-white/20 rounded-none text-white font-mono uppercase focus:border-white placeholder:text-white/30"
                      />
                      <Select value={newTaskVisibility} onValueChange={setNewTaskVisibility}>
                        <SelectTrigger className="w-40 bg-black border-white/20 rounded-none text-white font-mono uppercase text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border border-white/20 rounded-none text-white">
                          <SelectItem value="private" className="font-mono uppercase text-xs focus:bg-white focus:text-black">PRIVATE</SelectItem>
                          <SelectItem value="shared" className="font-mono uppercase text-xs focus:bg-white focus:text-black">SHARED</SelectItem>
                          <SelectItem value="client" className="font-mono uppercase text-xs focus:bg-white focus:text-black">CLIENT_VISIBLE</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addTask} className="bg-white text-black hover:bg-white/80 rounded-none aspect-square p-0 w-10">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {tasks.length === 0 ? (
                        <p className="text-white/20 text-center py-8 font-mono uppercase text-xs tracking-widest border border-white/10 border-dashed">
                          NO_TASKS_PENDING
                        </p>
                      ) : (
                        tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={task.is_completed}
                                onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
                                className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black rounded-none"
                              />
                              <span className={`font-mono text-sm uppercase ${task.is_completed ? 'line-through text-white/30' : 'text-white'}`}>
                                {task.title}
                              </span>
                              <Badge variant="outline" className="text-[9px] rounded-none border-white/20 text-white/50 font-mono uppercase tracking-widest">
                                {task.visibility}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTask(task.id)}
                              className="text-white/30 hover:text-white hover:bg-transparent rounded-none"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BRIEFING */}
              <TabsContent value="briefing">
                <Card className="bg-black border border-white/20 rounded-none">
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-white font-serif uppercase tracking-wide">BRIEFING_DATA</CardTitle>
                    <CardDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">CLIENT_INPUTS</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {!briefing ? (
                      <div className="text-center py-12 border border-white/10 border-dashed bg-white/5">
                        <ClipboardList className="h-12 w-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40 mb-4 font-mono text-xs uppercase tracking-widest">
                          NO_BRIEFING_INITIATED
                        </p>
                        <Button onClick={createDefaultBriefing} className="bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                          <Plus className="h-4 w-4 mr-2" />
                          Initialize_Briefing
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={`rounded-none font-mono text-[9px] uppercase tracking-widest px-3 py-1 ${briefing.is_submitted ? 'bg-white text-black border-white' : 'text-white/50 border-white/30'
                            }`}>
                            {briefing.is_submitted ? 'STATUS: COMPLETED' : 'STATUS: WAITING'}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={copyPortalLink} className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase">
                            <ExternalLink className="h-3 w-3 mr-2" />
                            Send_to_client
                          </Button>
                        </div>

                        <div className="space-y-4 mt-6">
                          {(briefing.questions as any[]).map((q: any) => (
                            <div key={q.id} className="p-4 border border-white/10 bg-white/5">
                              <p className="font-mono text-xs text-white/60 mb-2 uppercase tracking-wide">Q. {q.question}</p>
                              <p className="font-serif text-white pl-4 border-l border-white/20">
                                {briefing.answers[q.id] || '---'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CONTRATOS */}
              <TabsContent value="contratos">
                <Card className="bg-black border border-white/20 rounded-none">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
                    <div>
                      <CardTitle className="text-white font-serif uppercase tracking-wide">LEGAL_DOCS</CardTitle>
                      <CardDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">CONTRACTS & AGREEMENTS</CardDescription>
                    </div>
                    <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                          <Plus className="h-3 w-3 mr-2" />
                          NEW_CONTRACT
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-black border border-white/20 rounded-none">
                        <DialogHeader>
                          <DialogTitle className="text-white font-serif uppercase tracking-wide">DRAFT_CONTRACT</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={createContract} className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">TITLE</Label>
                            <Input
                              value={contractTitle}
                              onChange={(e) => setContractTitle(e.target.value)}
                              placeholder="DOC_REFERENCE"
                              className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">CONTENT</Label>
                            <Textarea
                              value={contractContent}
                              onChange={(e) => setContractContent(e.target.value)}
                              placeholder="LEGAL_TEXT_BODY..."
                              rows={10}
                              className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white"
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                            GENERATE_DOCUMENT
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="p-6">
                    {contracts.length === 0 ? (
                      <p className="text-white/20 text-center py-8 font-mono uppercase text-xs tracking-widest border border-white/10 border-dashed">
                        NO_DOCUMENTS_FILED
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {contracts.map((contract) => (
                          <div
                            key={contract.id}
                            className="flex items-center justify-between p-4 border border-white/10 bg-white/5 hover:border-white/30 transition-colors"
                          >
                            <div>
                              <p className="font-serif text-white uppercase tracking-wide text-sm mb-1">{contract.title}</p>
                              <Badge variant="outline" className={`rounded-none font-mono text-[9px] uppercase tracking-widest border-white/20 text-white/50`}>
                                STATUS: {contract.status}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              VIEW
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FINANCEIRO */}
              <TabsContent value="financeiro">
                <div className="space-y-6">
                  {/* Payment Progress */}
                  <Card className="bg-black border border-white/20 rounded-none">
                    <CardHeader className="border-b border-white/10">
                      <CardTitle className="text-white font-serif uppercase tracking-wide">FINANCIAL_OVERVIEW</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm font-mono text-white/70 uppercase tracking-widest">
                          <span>PAID: R$ {totalPaidAmount.toFixed(2)}</span>
                          <span>TOTAL: R$ {totalServiceAmount.toFixed(2)}</span>
                        </div>
                        <Progress value={totalServiceAmount > 0 ? (totalPaidAmount / totalServiceAmount) * 100 : 0} className="h-2 rounded-none bg-white/10" />
                        <div className="text-right">
                          <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
                            {((totalServiceAmount > 0 ? (totalPaidAmount / totalServiceAmount) * 100 : 0)).toFixed(1)}% RECOVERED
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Services List */}
                  <Card className="bg-black border border-white/20 rounded-none">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
                      <div>
                        <CardTitle className="text-white font-serif uppercase tracking-wide">SERVICES_BREAKDOWN</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        {/* Add Service Dialog */}
                        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest">
                              <Plus className="h-3 w-3 mr-2" /> ADD_SERVICE
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black border border-white/20 rounded-none">
                            <DialogHeader>
                              <DialogTitle className="text-white font-serif uppercase">ADD_SERVICE_ITEM</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={addServiceToProject} className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">SERVICE_TYPE</Label>
                                <Select value={selectedServiceId} onValueChange={handleSelectService}>
                                  <SelectTrigger className="bg-black border-white/20 rounded-none text-white font-mono uppercase">
                                    <SelectValue placeholder="SELECT..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-black border border-white/20 rounded-none text-white">
                                    {services.map(s => (
                                      <SelectItem key={s.id} value={s.id} className="font-mono uppercase focus:bg-white focus:text-black">
                                        {s.name} - R$ {s.price}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-4">
                                <div className="space-y-2 flex-1">
                                  <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">QTY</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={serviceQuantity}
                                    onChange={(e) => setServiceQuantity(e.target.value)}
                                    className="bg-black border-white/20 rounded-none text-white font-mono"
                                  />
                                </div>
                                <div className="space-y-2 flex-1">
                                  <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">PRICE (UNIT)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={servicePrice}
                                    onChange={(e) => setServicePrice(e.target.value)}
                                    className="bg-black border-white/20 rounded-none text-white font-mono"
                                  />
                                </div>
                              </div>
                              <Button type="submit" className="w-full bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                                CONFIRM_ADDITION
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>

                        {/* Add Payment Dialog */}
                        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                              <DollarSign className="h-3 w-3 mr-2" /> LOG_PAYMENT
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black border border-white/20 rounded-none">
                            <DialogHeader>
                              <DialogTitle className="text-white font-serif uppercase">REGISTER_INCOME</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={registerPayment} className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">ALLOCATE_TO_SERVICE</Label>
                                <Select value={paymentServiceId} onValueChange={setPaymentServiceId}>
                                  <SelectTrigger className="bg-black border-white/20 rounded-none text-white font-mono uppercase">
                                    <SelectValue placeholder="SELECT..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-black border border-white/20 rounded-none text-white">
                                    {projectServices.map(ps => (
                                      <SelectItem key={ps.id} value={ps.id} className="font-mono uppercase focus:bg-white focus:text-black">
                                        {ps.service?.name} (Rem: R$ {(ps.total_price - ps.paid_amount).toFixed(2)})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">AMOUNT</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                  placeholder="0.00"
                                  className="bg-black border-white/20 rounded-none text-white font-mono"
                                />
                              </div>
                              <Button type="submit" className="w-full bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                                PROCESS_TRANSACTION
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {projectServices.length === 0 ? (
                        <div className="p-12 text-center text-white/30 font-mono uppercase text-xs tracking-widest">
                          NO_SERVICES_LINKED
                        </div>
                      ) : (
                        <div className="divide-y divide-white/10">
                          {projectServices.map((ps) => (
                            <div key={ps.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                              <div>
                                <p className="font-serif text-white uppercase text-sm mb-1">{ps.service?.name}</p>
                                <div className="flex gap-4 text-[10px] text-white/50 font-mono uppercase tracking-widest">
                                  <span>QTY: {ps.quantity}</span>
                                  <span>UNIT: R$ {ps.unit_price.toFixed(2)}</span>
                                  <span>TOTAL: R$ {ps.total_price.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-mono text-xs text-white uppercase">
                                    PAID: R$ {ps.paid_amount.toFixed(2)}
                                  </p>
                                  {ps.paid_amount < ps.total_price && (
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                      PENDING: R$ {(ps.total_price - ps.paid_amount).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeServiceFromProject(ps.id)}
                                  className="text-white/20 hover:text-white hover:bg-transparent rounded-none"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
