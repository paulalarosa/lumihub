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
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProjectService } from '@/services/projectService';

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

    // Fetch project
    const { data: projectData, error: projectError } = await ProjectService.get(id);

    if (projectError || !projectData) {
      toast({ title: "Projeto não encontrado", variant: "destructive" });
      navigate('/projetos');
      return;
    }

    // Adapt data if necessary (service returns client as single object likely as 'client' or 'clients')
    // Based on previous files, let's assume 'clients' is populated if using select string properly.
    // However, ProjectService uses `client:clients(*)` alias.
    const adaptedProject: any = { ...projectData };
    if (adaptedProject.client) {
      adaptedProject.clients = adaptedProject.client;
      delete adaptedProject.client;
    }
    setProject(adaptedProject as Project);

    // Fetch tasks
    const { data: tasksData } = await ProjectService.getTasks(id);
    setTasks((tasksData as any) || []);

    // Fetch briefing
    const { data: briefingData } = await ProjectService.getBriefing(id);
    if (briefingData) {
      setBriefing({
        ...briefingData,
        questions: briefingData.questions as any[],
        answers: briefingData.answers as Record<string, any>
      } as any);
    }

    // Fetch contracts
    const { data: contractsData } = await ProjectService.getContracts(id);
    setContracts((contractsData as any) || []);

    // Fetch services catalog
    const { data: servicesData } = await ProjectService.getCatalogServices();
    setServices((servicesData as any) || []);

    // Fetch project services
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
      // Optimistic update or refetch
      // For simplicity/safety, refetch partial
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
      status: 'draft' // ensure default
    });

    if (error) {
      toast({ title: "Erro ao criar contrato", variant: "destructive" });
    } else {
      toast({ title: "Contrato criado!" });
      setIsContractDialogOpen(false);
      setContractTitle('');
      setContractContent('');
      // Refetch contracts
      const { data } = await ProjectService.getContracts(id);
      setContracts((data as any) || []);
    }
  };

  const copyPortalLink = () => {
    const link = `${window.location.origin}/portal/${project?.public_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 2000);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) return null;

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const totalServiceAmount = projectServices.reduce((sum, ps) => sum + Number(ps.total_price), 0);
  const totalPaidAmount = projectServices.reduce((sum, ps) => sum + Number(ps.paid_amount), 0);
  const remainingAmount = totalServiceAmount - totalPaidAmount;


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/projetos">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-poppins font-bold text-xl text-foreground">
                  {project.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {project.clients && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {project.clients.name}
                    </span>
                  )}
                  {project.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(project.event_date), 'dd/MM/yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'internal' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('internal')}
                  className="rounded-none gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Interno
                </Button>
                <Button
                  variant={viewMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('preview')}
                  className="rounded-none gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Prévia Cliente
                </Button>
              </div>

              <Button variant="outline" onClick={copyPortalLink} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Link do Portal'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {viewMode === 'preview' ? (
          /* PUBLIC PREVIEW - What the client sees */
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Prévia do Portal da Cliente
                </CardTitle>
                <CardDescription>
                  Isso é o que sua cliente verá ao acessar o link do portal
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="space-y-6">
              {/* Contract Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Contrato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contracts.filter(c => c.status === 'sent' || c.status === 'signed').length === 0 ? (
                    <p className="text-muted-foreground">Nenhum contrato enviado ainda</p>
                  ) : (
                    <div className="space-y-3">
                      {contracts.filter(c => c.status === 'sent' || c.status === 'signed').map(contract => (
                        <div key={contract.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{contract.title}</span>
                            <Badge variant={contract.status === 'signed' ? 'default' : 'secondary'}>
                              {contract.status === 'signed' ? 'Assinado' : 'Aguardando assinatura'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Briefing Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Briefing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!briefing ? (
                    <p className="text-muted-foreground">Nenhum questionário criado</p>
                  ) : (
                    <div className="space-y-4">
                      <Badge variant={briefing.is_submitted ? 'default' : 'secondary'}>
                        {briefing.is_submitted ? 'Respondido' : 'Aguardando resposta'}
                      </Badge>
                      {briefing.is_submitted && (
                        <div className="space-y-3 mt-4">
                          {(briefing.questions as any[]).map((q: any) => (
                            <div key={q.id} className="text-sm">
                              <p className="font-medium">{q.question}</p>
                              <p className="text-muted-foreground">{briefing.answers[q.id] || '-'}</p>
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
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Tarefas</p>
                  <p className="text-2xl font-bold">{completedTasks}/{tasks.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Serviços</p>
                  <p className="text-2xl font-bold">R$ {totalServiceAmount.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Recebido</p>
                  <p className="text-2xl font-bold text-green-600">R$ {totalPaidAmount.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold text-orange-500">R$ {remainingAmount.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="tarefas">
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="tarefas" className="gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tarefas
                </TabsTrigger>
                <TabsTrigger value="briefing" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Briefing
                </TabsTrigger>
                <TabsTrigger value="contratos" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Contratos
                </TabsTrigger>
                <TabsTrigger value="financeiro" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financeiro
                </TabsTrigger>
              </TabsList>

              {/* TAREFAS */}
              <TabsContent value="tarefas">
                <Card>
                  <CardHeader>
                    <CardTitle>Checklist de Tarefas</CardTitle>
                    <CardDescription>Organize as tarefas do projeto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-6">
                      <Input
                        placeholder="Nova tarefa..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                        className="flex-1"
                      />
                      <Select value={newTaskVisibility} onValueChange={setNewTaskVisibility}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Privado</SelectItem>
                          <SelectItem value="shared">Compartilhado</SelectItem>
                          <SelectItem value="client">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addTask}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {tasks.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Nenhuma tarefa ainda
                        </p>
                      ) : (
                        tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={task.is_completed}
                                onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
                              />
                              <span className={task.is_completed ? 'line-through text-muted-foreground' : ''}>
                                {task.title}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {task.visibility === 'private' ? 'Privado' : task.visibility === 'shared' ? 'Compartilhado' : 'Cliente'}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
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
                <Card>
                  <CardHeader>
                    <CardTitle>Questionário de Briefing</CardTitle>
                    <CardDescription>Informações coletadas da cliente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!briefing ? (
                      <div className="text-center py-12">
                        <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                          Nenhum questionário criado ainda
                        </p>
                        <Button onClick={createDefaultBriefing}>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Questionário
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant={briefing.is_submitted ? 'default' : 'secondary'}>
                            {briefing.is_submitted ? 'Respondido' : 'Aguardando Resposta'}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={copyPortalLink}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Enviar para Cliente
                          </Button>
                        </div>

                        <div className="space-y-4 mt-4">
                          {(briefing.questions as any[]).map((q: any) => (
                            <div key={q.id} className="p-4 border rounded-lg">
                              <p className="font-medium mb-2">{q.question}</p>
                              <p className="text-muted-foreground">
                                {briefing.answers[q.id] || 'Não respondido'}
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
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Contratos</CardTitle>
                      <CardDescription>Gerencie os contratos do projeto</CardDescription>
                    </div>
                    <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Contrato
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Novo Contrato</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={createContract} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                              value={contractTitle}
                              onChange={(e) => setContractTitle(e.target.value)}
                              placeholder="Ex: Contrato de Serviços de Maquiagem"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Conteúdo do Contrato</Label>
                            <Textarea
                              value={contractContent}
                              onChange={(e) => setContractContent(e.target.value)}
                              placeholder="Digite o conteúdo do contrato..."
                              rows={10}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">Criar Contrato</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {contracts.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum contrato criado
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {contracts.map((contract) => (
                          <div
                            key={contract.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{contract.title}</p>
                              <Badge variant={
                                contract.status === 'signed' ? 'default' :
                                  contract.status === 'sent' ? 'secondary' : 'outline'
                              }>
                                {contract.status === 'signed' ? 'Assinado' :
                                  contract.status === 'sent' ? 'Enviado' : 'Rascunho'}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo Financeiro</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Pago: R$ {totalPaidAmount.toFixed(2)}</span>
                          <span>Total: R$ {totalServiceAmount.toFixed(2)}</span>
                        </div>
                        <Progress value={totalServiceAmount > 0 ? (totalPaidAmount / totalServiceAmount) * 100 : 0} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Services List */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Serviços e Valores</CardTitle>
                        <CardDescription>O que foi contratado</CardDescription>
                      </div>
                      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Serviço
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Serviço</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={addServiceToProject} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Serviço</Label>
                              <Select value={selectedServiceId} onValueChange={handleSelectService}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {services.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                      {s.name} - R$ {s.price}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Quantidade</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={serviceQuantity}
                                  onChange={(e) => setServiceQuantity(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Valor Unitário (R$)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={servicePrice}
                                  onChange={(e) => setServicePrice(e.target.value)}
                                />
                              </div>
                            </div>
                            <Button type="submit" className="w-full">Adicionar</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {projectServices.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            Nenhum serviço adicionado
                          </p>
                        ) : (
                          projectServices.map((ps) => (
                            <div key={ps.id} className="flex flex-col p-4 border rounded-lg gap-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{ps.service?.name || ps.notes || 'Serviço Personalizado'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {ps.quantity}x R$ {ps.unit_price.toFixed(2)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">R$ {ps.total_price.toFixed(2)}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-red-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => removeServiceFromProject(ps.id)}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 bg-muted/50 p-2 rounded text-sm">
                                <div className="flex-1">
                                  <span className="text-muted-foreground">Pago: </span>
                                  <span className="font-medium text-green-600">R$ {ps.paid_amount.toFixed(2)}</span>
                                </div>
                                <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
                                  setIsPaymentDialogOpen(open);
                                  if (open) setPaymentServiceId(ps.id);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-xs">
                                      Registrar Pagamento
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Registrar Pagamento</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={registerPayment} className="space-y-4">
                                      <div className="space-y-2">
                                        <Label>Valor do Pagamento (R$)</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          max={(ps.total_price - ps.paid_amount)}
                                          value={paymentAmount}
                                          onChange={(e) => setPaymentAmount(e.target.value)}
                                          placeholder={`Máx: ${(ps.total_price - ps.paid_amount).toFixed(2)}`}
                                        />
                                      </div>
                                      <Button type="submit" className="w-full">Confirmar</Button>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
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
