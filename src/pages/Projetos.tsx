import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Calendar,
  FolderOpen,
  MapPin,
  User,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  event_type: string | null;
  event_date: string | null;
  event_location: string | null;
  status: string;
  public_token: string;
  created_at: string;
  clients: {
    id: string;
    name: string;
  } | null;
}

interface Client {
  id: string;
  name: string;
}

export default function Projetos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(searchParams.get('cliente') || '');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('cliente')) {
      setClientId(searchParams.get('cliente') || '');
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoadingData(true);
    
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*, clients(id, name)')
      .order('created_at', { ascending: false });

    if (!projectsError) {
      setProjects(projectsData || []);
    }

    const { data: clientsData } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');
    
    setClients(clientsData || []);
    setLoadingData(false);
  };

  const resetForm = () => {
    setName('');
    setClientId('');
    setEventType('');
    setEventDate('');
    setEventLocation('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !clientId) {
      toast({ title: "Nome e cliente são obrigatórios", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        client_id: clientId,
        event_type: eventType || null,
        event_date: eventDate || null,
        event_location: eventLocation.trim() || null,
        user_id: user!.id
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao criar projeto", variant: "destructive" });
    } else {
      toast({ title: "Projeto criado!" });
      setIsDialogOpen(false);
      resetForm();
      navigate(`/projetos/${data.id}`);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.clients?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const eventTypes = [
    'Casamento',
    'Formatura',
    'Debutante',
    'Ensaio Fotográfico',
    'Evento Corporativo',
    'Festa',
    'Outro'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-white" />
                </div>
                <span className="font-poppins font-bold text-xl text-foreground">
                  Projetos
                </span>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Projeto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Projeto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Projeto *</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Casamento Ana e João"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente *</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {clients.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        <Link to="/clientes" className="text-primary hover:underline">
                          Cadastre uma cliente primeiro
                        </Link>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Evento</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data do Evento</Label>
                    <Input 
                      type="date"
                      value={eventDate} 
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Local</Label>
                    <Input 
                      value={eventLocation} 
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Ex: São Paulo, SP"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={clients.length === 0}>
                    Criar Projeto
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total de Projetos</p>
              <p className="text-2xl font-bold">{projects.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Concluídos</p>
              <p className="text-2xl font-bold">
                {projects.filter(p => p.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Project List */}
        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto criado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente uma busca diferente' : 'Comece criando seu primeiro projeto'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Projeto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Link key={project.id} to={`/projetos/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        {project.event_type && (
                          <Badge variant="outline" className="mt-1">
                            {project.event_type}
                          </Badge>
                        )}
                      </div>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status === 'active' ? 'Ativo' : project.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {project.clients && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{project.clients.name}</span>
                        </div>
                      )}
                      {project.event_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(project.event_date), 'dd/MM/yyyy')}</span>
                        </div>
                      )}
                      {project.event_location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{project.event_location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
