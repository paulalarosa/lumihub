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
  ExternalLink,
  Terminal
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
  wedding_clients: {
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
      .select('*, wedding_clients(id, name)')
      .order('created_at', { ascending: false });

    if (!projectsError) {
      setProjects(projectsData || []);
    }

    const { data: clientsData } = await supabase
      .from('wedding_clients')
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
    project.wedding_clients?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-white/20 bg-black">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white hover:text-black rounded-none">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 border border-white/20 bg-black flex items-center justify-center rounded-none hover:bg-white hover:text-black transition-all group">
                  <FolderOpen className="h-5 w-5 text-white group-hover:text-black transition-colors" />
                </div>
                <div>
                  <h1 className="font-serif font-bold text-2xl text-white uppercase tracking-tighter">PROJECTS</h1>
                  <div className="text-[10px] text-white/50 uppercase tracking-[0.3em]">/// WORKFLOW_MANAGER</div>
                </div>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs uppercase tracking-widest">
                  <Plus className="h-4 w-4" />
                  NEW_PROJECT
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-black border border-white/20 rounded-none text-white">
                <DialogHeader>
                  <DialogTitle className="font-serif uppercase tracking-wide">INITIALIZE PROJECT</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-mono uppercase text-xs tracking-widest text-white/70">PROJECT_NAME</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="MISSION_CODENAME"
                      className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono uppercase text-xs tracking-widest text-white/70">CLIENT_ID</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger className="bg-black border-white/20 rounded-none text-white font-mono">
                        <SelectValue placeholder="SELECT_TARGET" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border border-white/20 rounded-none text-white">
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id} className="font-mono uppercase focus:bg-white focus:text-black">
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {clients.length === 0 && (
                      <p className="text-xs text-white/40 font-mono uppercase">
                        <Link to="/clientes" className="text-white hover:underline underline-offset-4 decoration-white/30">
                          REGISTER_CLIENT_FIRST &rarr;
                        </Link>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono uppercase text-xs tracking-widest text-white/70">EVENT_TYPE</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger className="bg-black border-white/20 rounded-none text-white font-mono">
                        <SelectValue placeholder="SELECT_TYPE" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border border-white/20 rounded-none text-white">
                        {eventTypes.map(type => (
                          <SelectItem key={type} value={type} className="font-mono uppercase focus:bg-white focus:text-black">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono uppercase text-xs tracking-widest text-white/70">TARGET_DATE</Label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white invert-calendar-icon"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono uppercase text-xs tracking-widest text-white/70">COORDINATES (LOCATION)</Label>
                    <Input
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="SECTOR_01"
                      className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 rounded-none font-mono uppercase tracking-widest" disabled={clients.length === 0}>
                    INITIALIZE
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
            <Input
              placeholder="SEARCH_DATABASE..."
              className="pl-10 bg-black border-white/20 rounded-none text-white font-mono focus:border-white placeholder:text-white/30 uppercase tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-black border border-white/20 rounded-none">
            <CardContent className="pt-6">
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">TOTAL_PROJECTS</p>
              <p className="text-4xl font-serif text-white">{projects.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-black border border-white/20 rounded-none">
            <CardContent className="pt-6">
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">ACTIVE_MISSIONS</p>
              <p className="text-4xl font-serif text-white">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-black border border-white/20 rounded-none">
            <CardContent className="pt-6">
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">COMPLETED</p>
              <p className="text-4xl font-serif text-white">
                {projects.filter(p => p.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Project List */}
        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="bg-black border border-white/10 border-dashed rounded-none">
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <h3 className="font-serif text-lg mb-2 text-white uppercase tracking-wide">
                {searchTerm ? 'NO_DATA_FOUND' : 'DATABASE_EMPTY'}
              </h3>
              <p className="text-white/40 mb-6 font-mono text-xs uppercase tracking-widest">
                {searchTerm ? 'REFINE_SEARCH_PARAMETERS' : 'INITIALIZE_FIRST_PROJECT'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)} className="bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs uppercase tracking-widest">
                  <Plus className="h-4 w-4 mr-2" />
                  CREATE_PROJECT
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link key={project.id} to={`/projetos/${project.id}`}>
                <Card className="bg-black border border-white/20 rounded-none hover:border-white transition-all duration-300 group h-full">
                  <CardHeader className="pb-4 border-b border-white/10 group-hover:border-white/20">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-serif text-white uppercase tracking-wide group-hover:text-white transition-colors">{project.name}</CardTitle>
                        {project.event_type && (
                          <div className="inline-block border border-white/20 px-2 py-0.5 text-[9px] font-mono text-white/60 uppercase tracking-widest">
                            {project.event_type}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className={`rounded-none border font-mono text-[9px] uppercase tracking-widest ${project.status === 'active' ? 'border-white text-white' :
                        project.status === 'completed' ? 'border-white/40 text-white/40' : 'border-white/20 text-white/20'
                        }`}>
                        {project.status === 'active' ? 'ACTIVE' : project.status === 'completed' ? 'DONE' : 'VOID'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3 text-xs text-white/60 font-mono uppercase tracking-wide">
                      {project.wedding_clients && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-white/40" />
                          <span className="text-white/80">{project.wedding_clients.name}</span>
                        </div>
                      )}
                      {project.event_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-white/40" />
                          <span>{project.event_date ? format(new Date(project.event_date), 'dd.MM.yyyy') : 'TBD'}</span>
                        </div>
                      )}
                      {project.event_location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-white/40" />
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
