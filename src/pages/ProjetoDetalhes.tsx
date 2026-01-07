import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  MapPin,
  User,
  ExternalLink,
  CheckSquare,
  Image,
  FileText,
  DollarSign,
  ClipboardList,
  Plus,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  event_type: string | null;
  event_date: string | null;
  event_location: string | null;
  status: string;
  public_token: string;
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

interface MoodboardImage {
  id: string;
  image_url: string;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
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

interface Invoice {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  due_date: string | null;
  paid_at: string | null;
}

export default function ProjetoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [moodboard, setMoodboard] = useState<MoodboardImage[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskVisibility, setNewTaskVisibility] = useState('private');
  
  // Invoice form
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');

  // Contract form
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [contractTitle, setContractTitle] = useState('');
  const [contractContent, setContractContent] = useState('');

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchData();
    }
  }, [user, id]);

  const fetchData = async () => {
    setLoadingData(true);
    
    // Fetch project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*, clients(id, name, email, phone)')
      .eq('id', id)
      .maybeSingle();

    if (projectError || !projectData) {
      toast({ title: "Projeto não encontrado", variant: "destructive" });
      navigate('/projetos');
      return;
    }
    
    setProject(projectData);

    // Fetch tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('sort_order');
    setTasks(tasksData || []);

    // Fetch moodboard
    const { data: moodboardData } = await supabase
      .from('moodboard_images')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });
    setMoodboard(moodboardData || []);

    // Fetch briefing
    const { data: briefingData } = await supabase
      .from('briefings')
      .select('*')
      .eq('project_id', id)
      .maybeSingle();
    if (briefingData) {
      setBriefing({
        ...briefingData,
        questions: briefingData.questions as any[],
        answers: briefingData.answers as Record<string, any>
      });
    }

    // Fetch contracts
    const { data: contractsData } = await supabase
      .from('contracts')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });
    setContracts(contractsData || []);

    // Fetch invoices
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });
    setInvoices(invoicesData || []);
    
    setLoadingData(false);
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    const { error } = await supabase
      .from('tasks')
      .insert({
        project_id: id,
        user_id: user!.id,
        title: newTaskTitle.trim(),
        visibility: newTaskVisibility,
        sort_order: tasks.length
      });

    if (error) {
      toast({ title: "Erro ao adicionar tarefa", variant: "destructive" });
    } else {
      setNewTaskTitle('');
      fetchData();
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: completed })
      .eq('id', taskId);

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: completed } : t));
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('invoices')
      .insert({
        project_id: id,
        user_id: user!.id,
        amount: parseFloat(invoiceAmount),
        description: invoiceDescription.trim() || null,
        due_date: invoiceDueDate || null
      });

    if (error) {
      toast({ title: "Erro ao criar fatura", variant: "destructive" });
    } else {
      toast({ title: "Fatura criada!" });
      setIsInvoiceDialogOpen(false);
      setInvoiceAmount('');
      setInvoiceDescription('');
      setInvoiceDueDate('');
      fetchData();
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    const updates: any = { status };
    if (status === 'paid') {
      updates.paid_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId);

    if (!error) {
      fetchData();
      toast({ title: "Status atualizado!" });
    }
  };

  const createContract = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('contracts')
      .insert({
        project_id: id,
        user_id: user!.id,
        title: contractTitle.trim(),
        content: contractContent.trim()
      });

    if (error) {
      toast({ title: "Erro ao criar contrato", variant: "destructive" });
    } else {
      toast({ title: "Contrato criado!" });
      setIsContractDialogOpen(false);
      setContractTitle('');
      setContractContent('');
      fetchData();
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
    const defaultQuestions = [
      { id: '1', question: 'Qual é o seu tipo de pele? (oleosa, seca, mista, normal)', type: 'text' },
      { id: '2', question: 'Você tem alguma alergia a cosméticos?', type: 'text' },
      { id: '3', question: 'Qual estilo de maquiagem você prefere?', type: 'text' },
      { id: '4', question: 'Quais cores você gostaria de usar?', type: 'text' },
      { id: '5', question: 'Você usará cílios postiços?', type: 'text' },
      { id: '6', question: 'Alguma observação adicional?', type: 'text' }
    ];

    const { error } = await supabase
      .from('briefings')
      .insert({
        project_id: id,
        user_id: user!.id,
        questions: defaultQuestions
      });

    if (!error) {
      toast({ title: "Questionário criado!" });
      fetchData();
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) return null;

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0);

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
            
            <Button variant="outline" onClick={copyPortalLink} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado!' : 'Link do Portal'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
              <p className="text-sm text-muted-foreground">Moodboard</p>
              <p className="text-2xl font-bold">{moodboard.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Faturado</p>
              <p className="text-2xl font-bold">R$ {totalAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Recebido</p>
              <p className="text-2xl font-bold text-green-600">R$ {paidAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tarefas">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="tarefas" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="moodboard" className="gap-2">
              <Image className="h-4 w-4" />
              Moodboard
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

          {/* MOODBOARD */}
          <TabsContent value="moodboard">
            <Card>
              <CardHeader>
                <CardTitle>Moodboard</CardTitle>
                <CardDescription>Referências visuais do projeto</CardDescription>
              </CardHeader>
              <CardContent>
                {moodboard.length === 0 ? (
                  <div className="text-center py-12">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Nenhuma imagem ainda. Adicione referências através do portal da cliente.
                    </p>
                    <Button variant="outline" onClick={copyPortalLink}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Copiar Link do Portal
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {moodboard.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.image_url}
                          alt={img.caption || 'Moodboard image'}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        {img.caption && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {img.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Faturas</CardTitle>
                  <CardDescription>Gerencie os pagamentos do projeto</CardDescription>
                </div>
                <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Fatura
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Fatura</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={createInvoice} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={invoiceAmount}
                          onChange={(e) => setInvoiceAmount(e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input 
                          value={invoiceDescription}
                          onChange={(e) => setInvoiceDescription(e.target.value)}
                          placeholder="Ex: Maquiagem para noiva + madrinhas"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Vencimento</Label>
                        <Input 
                          type="date"
                          value={invoiceDueDate}
                          onChange={(e) => setInvoiceDueDate(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full">Criar Fatura</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma fatura criada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div 
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">R$ {Number(invoice.amount).toFixed(2)}</p>
                          {invoice.description && (
                            <p className="text-sm text-muted-foreground">{invoice.description}</p>
                          )}
                          {invoice.due_date && (
                            <p className="text-xs text-muted-foreground">
                              Vence: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            invoice.status === 'paid' ? 'default' : 
                            invoice.status === 'overdue' ? 'destructive' : 'secondary'
                          }>
                            {invoice.status === 'paid' ? 'Pago' : 
                             invoice.status === 'overdue' ? 'Vencido' : 'Pendente'}
                          </Badge>
                          {invoice.status !== 'paid' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                            >
                              Marcar Pago
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
