import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles,
  Calendar,
  MapPin,
  CheckSquare,
  Image,
  ClipboardList,
  FileText,
  DollarSign,
  Send,
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
  user_id: string;
}

interface ProfessionalSettings {
  business_name: string | null;
  logo_url: string | null;
  primary_color: string;
  phone: string | null;
  instagram: string | null;
}

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  visibility: string;
}

interface MoodboardImage {
  id: string;
  image_url: string;
  caption: string | null;
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
}

interface Invoice {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  due_date: string | null;
}

export default function PortalCliente() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [settings, setSettings] = useState<ProfessionalSettings | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [moodboard, setMoodboard] = useState<MoodboardImage[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [briefingAnswers, setBriefingAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch project by public token - this is a public query
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, name, event_type, event_date, event_location, user_id')
      .eq('public_token', token)
      .maybeSingle();

    if (projectError || !projectData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    
    setProject(projectData);

    // Fetch professional settings
    const { data: settingsData } = await supabase
      .from('professional_settings')
      .select('business_name, logo_url, primary_color, phone, instagram')
      .eq('user_id', projectData.user_id)
      .maybeSingle();
    
    setSettings(settingsData);

    // Fetch client-visible tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('id, title, is_completed, visibility')
      .eq('project_id', projectData.id)
      .in('visibility', ['shared', 'client'])
      .order('sort_order');
    setTasks(tasksData || []);

    // Fetch moodboard
    const { data: moodboardData } = await supabase
      .from('moodboard_images')
      .select('id, image_url, caption')
      .eq('project_id', projectData.id)
      .order('created_at', { ascending: false });
    setMoodboard(moodboardData || []);

    // Fetch briefing
    const { data: briefingData } = await supabase
      .from('briefings')
      .select('id, questions, answers, is_submitted')
      .eq('project_id', projectData.id)
      .maybeSingle();
    
    if (briefingData) {
      setBriefing({
        ...briefingData,
        questions: briefingData.questions as any[],
        answers: briefingData.answers as Record<string, any>
      });
      setBriefingAnswers(briefingData.answers as Record<string, string>);
    }

    // Fetch contracts (only sent or signed)
    const { data: contractsData } = await supabase
      .from('contracts')
      .select('id, title, content, status')
      .eq('project_id', projectData.id)
      .in('status', ['sent', 'signed']);
    setContracts(contractsData || []);

    // Fetch invoices
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('id, amount, description, status, due_date')
      .eq('project_id', projectData.id)
      .order('created_at', { ascending: false });
    setInvoices(invoicesData || []);
    
    setLoading(false);
  };

  const toggleClientTask = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: completed })
      .eq('id', taskId)
      .eq('visibility', 'client'); // Only allow toggling client tasks

    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: completed } : t));
    }
  };

  const submitBriefing = async () => {
    if (!briefing) return;

    const { error } = await supabase
      .from('briefings')
      .update({ 
        answers: briefingAnswers,
        is_submitted: true,
        submitted_at: new Date().toISOString()
      })
      .eq('id', briefing.id);

    if (error) {
      toast({ title: "Erro ao enviar respostas", variant: "destructive" });
    } else {
      toast({ title: "Respostas enviadas com sucesso!" });
      setBriefing({ ...briefing, is_submitted: true, answers: briefingAnswers });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Projeto não encontrado</h2>
            <p className="text-muted-foreground">
              O link pode estar incorreto ou o projeto foi removido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = settings?.primary_color || '#5A7D7C';
  const businessName = settings?.business_name || 'Beauty Pro';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="border-b py-6"
        style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-3">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={businessName} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="font-poppins font-bold text-xl" style={{ color: primaryColor }}>
              {businessName}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Project Info */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{project.name}</CardTitle>
            <div className="flex items-center justify-center gap-4 text-muted-foreground mt-2">
              {project.event_type && (
                <Badge variant="outline">{project.event_type}</Badge>
              )}
              {project.event_date && (
                <span className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(project.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              )}
              {project.event_location && (
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="h-4 w-4" />
                  {project.event_location}
                </span>
              )}
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="checklist" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="checklist" className="text-xs sm:text-sm">
              <CheckSquare className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="moodboard" className="text-xs sm:text-sm">
              <Image className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Moodboard</span>
            </TabsTrigger>
            <TabsTrigger value="briefing" className="text-xs sm:text-sm">
              <ClipboardList className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Briefing</span>
            </TabsTrigger>
            <TabsTrigger value="contrato" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Contrato</span>
            </TabsTrigger>
            <TabsTrigger value="pagamento" className="text-xs sm:text-sm">
              <DollarSign className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Pagamento</span>
            </TabsTrigger>
          </TabsList>

          {/* CHECKLIST */}
          <TabsContent value="checklist">
            <Card>
              <CardHeader>
                <CardTitle>Suas Tarefas</CardTitle>
                <CardDescription>Acompanhe e complete suas tarefas</CardDescription>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma tarefa disponível ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div 
                        key={task.id}
                        className="flex items-center gap-3 p-4 border rounded-lg"
                      >
                        <Checkbox
                          checked={task.is_completed}
                          onCheckedChange={(checked) => {
                            if (task.visibility === 'client') {
                              toggleClientTask(task.id, checked as boolean);
                            }
                          }}
                          disabled={task.visibility !== 'client'}
                        />
                        <span className={task.is_completed ? 'line-through text-muted-foreground' : ''}>
                          {task.title}
                        </span>
                        {task.is_completed && (
                          <Check className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MOODBOARD */}
          <TabsContent value="moodboard">
            <Card>
              <CardHeader>
                <CardTitle>Moodboard</CardTitle>
                <CardDescription>Referências visuais para o seu look</CardDescription>
              </CardHeader>
              <CardContent>
                {moodboard.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma imagem adicionada ainda
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {moodboard.map((img) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.image_url}
                          alt={img.caption || 'Referência'}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        {img.caption && (
                          <p className="text-sm text-muted-foreground mt-1 text-center">
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
                <CardDescription>
                  {briefing?.is_submitted 
                    ? 'Suas respostas foram enviadas' 
                    : 'Responda as perguntas abaixo para personalizarmos seu atendimento'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!briefing ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum questionário disponível
                  </p>
                ) : briefing.is_submitted ? (
                  <div className="space-y-4">
                    {briefing.questions.map((q: any) => (
                      <div key={q.id} className="p-4 bg-muted/50 rounded-lg">
                        <p className="font-medium mb-1">{q.question}</p>
                        <p className="text-muted-foreground">
                          {briefing.answers[q.id] || 'Não respondido'}
                        </p>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span>Respostas enviadas com sucesso!</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {briefing.questions.map((q: any) => (
                      <div key={q.id} className="space-y-2">
                        <label className="font-medium">{q.question}</label>
                        <Textarea
                          value={briefingAnswers[q.id] || ''}
                          onChange={(e) => setBriefingAnswers({
                            ...briefingAnswers,
                            [q.id]: e.target.value
                          })}
                          placeholder="Sua resposta..."
                          rows={2}
                        />
                      </div>
                    ))}
                    <Button onClick={submitBriefing} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Respostas
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTRATO */}
          <TabsContent value="contrato">
            <Card>
              <CardHeader>
                <CardTitle>Contrato</CardTitle>
                <CardDescription>Visualize e assine seu contrato</CardDescription>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum contrato disponível
                  </p>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <div key={contract.id} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">{contract.title}</h3>
                          <Badge variant={contract.status === 'signed' ? 'default' : 'secondary'}>
                            {contract.status === 'signed' ? 'Assinado' : 'Pendente'}
                          </Badge>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg">
                            {contract.content}
                          </pre>
                        </div>
                        {contract.status !== 'signed' && (
                          <Button className="w-full mt-4">
                            Assinar Contrato
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAGAMENTO */}
          <TabsContent value="pagamento">
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos</CardTitle>
                <CardDescription>Visualize e pague suas faturas</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma fatura disponível
                  </p>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div 
                        key={invoice.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-lg">
                            R$ {Number(invoice.amount).toFixed(2)}
                          </p>
                          {invoice.description && (
                            <p className="text-sm text-muted-foreground">{invoice.description}</p>
                          )}
                          {invoice.due_date && (
                            <p className="text-xs text-muted-foreground">
                              Vence: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            invoice.status === 'paid' ? 'default' : 
                            invoice.status === 'overdue' ? 'destructive' : 'secondary'
                          }>
                            {invoice.status === 'paid' ? 'Pago' : 
                             invoice.status === 'overdue' ? 'Vencido' : 'Pendente'}
                          </Badge>
                          {invoice.status === 'pending' && (
                            <Button size="sm" className="mt-2">
                              Pagar Agora
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

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Portal exclusivo • {businessName}</p>
          {settings?.instagram && (
            <p className="mt-1">Instagram: {settings.instagram}</p>
          )}
        </footer>
      </main>
    </div>
  );
}
