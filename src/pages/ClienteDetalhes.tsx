import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Instagram,
  MessageSquare,
  Calendar,
  FileText,
  Plus,
  Send,
  Trash2,
  Tag,
  StickyNote
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
}

interface Interaction {
  id: string;
  type: string;
  content: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  event_type: string | null;
  event_date: string | null;
  status: string;
}

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [newNote, setNewNote] = useState('');

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
    
    // Fetch client
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (clientError || !clientData) {
      toast({ title: "Cliente não encontrado", variant: "destructive" });
      navigate('/clientes');
      return;
    }
    
    setClient(clientData);

    // Fetch interactions
    const { data: interactionsData } = await supabase
      .from('client_interactions')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false });
    
    setInteractions(interactionsData || []);

    // Fetch projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false });
    
    setProjects(projectsData || []);
    
    setLoadingData(false);
  };

  const addInteraction = async () => {
    if (!newNote.trim()) return;

    const { error } = await supabase
      .from('client_interactions')
      .insert({
        client_id: id,
        user_id: user!.id,
        type: 'note',
        content: newNote.trim()
      });

    if (error) {
      toast({ title: "Erro ao adicionar nota", variant: "destructive" });
    } else {
      toast({ title: "Nota adicionada!" });
      setNewNote('');
      fetchData();
    }
  };

  const deleteInteraction = async (interactionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta nota?')) return;
    
    const { error } = await supabase
      .from('client_interactions')
      .delete()
      .eq('id', interactionId);

    if (error) {
      toast({ title: "Erro ao excluir nota", variant: "destructive" });
    } else {
      toast({ title: "Nota excluída!" });
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

  if (!client) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/clientes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-xl text-foreground">
                  {client.name}
                </h1>
                {client.tags && client.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {client.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                )}
                {client.instagram && (
                  <div className="flex items-center gap-3">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.instagram}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Cliente desde {format(new Date(client.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {client.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Anotações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="projetos">
              <TabsList className="mb-4">
                <TabsTrigger value="projetos">
                  Projetos ({projects.length})
                </TabsTrigger>
                <TabsTrigger value="historico">
                  Histórico ({interactions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="projetos">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Projetos</CardTitle>
                    <Link to={`/projetos/novo?cliente=${client.id}`}>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Projeto
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {projects.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum projeto com esta cliente ainda
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {projects.map((project) => (
                          <Link 
                            key={project.id} 
                            to={`/projetos/${project.id}`}
                            className="block"
                          >
                            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div>
                                <p className="font-medium">{project.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {project.event_type}
                                  {project.event_date && ` • ${format(new Date(project.event_date), "dd/MM/yyyy")}`}
                                </p>
                              </div>
                              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                                {project.status === 'active' ? 'Ativo' : project.status === 'completed' ? 'Concluído' : 'Cancelado'}
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historico">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Interações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Add note form */}
                    <div className="flex gap-2 mb-6">
                      <Textarea
                        placeholder="Adicionar uma nota..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button onClick={addInteraction} disabled={!newNote.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    {interactions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhuma interação registrada
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {interactions.map((interaction) => (
                          <div 
                            key={interaction.id}
                            className="flex gap-3 p-4 border rounded-lg group"
                          >
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <StickyNote className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{interaction.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(interaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              onClick={() => deleteInteraction(interaction.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
