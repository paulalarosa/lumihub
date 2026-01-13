import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ArrowLeft,
  Plus,
  Search,
  User,
  Phone,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Star,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  notes: string | null;
  last_visit: string | null;
  created_at: string;
}

export default function Clientes() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    setLoadingClients(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar clientes", variant: "destructive" });
    } else {
      // Cast to Client[] since we're using a local interface that matches our needs
      setClients((data as any) || []);
    }
    setLoadingClients(false);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setEditingClient(null);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setNotes(client.notes || '');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    // Basic Validation for Phone/Email if needed

    setLoadingClients(true); // Re-use loading state or add specific submitting state? Let's assume loadingClients is for list only.
    // Ideally use isSubmitting state
    const isSubmitting = false; // Placeholder if we don't add state yet

    const clientData = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      user_id: user!.id
    };

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id);

        if (error) throw error;
        toast({ title: "Cliente atualizado!" });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);

        if (error) throw error;
        toast({ title: "Cliente adicionado!" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
      toast({ title: "Erro ao salvar cliente", variant: "destructive" });
    } finally {
      // setLoading(false); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) {
      toast({ title: "Erro ao excluir cliente", variant: "destructive" });
    } else {
      toast({ title: "Cliente excluído!" });
      fetchClients();
    }
  };

  const filteredClients = clients.filter(client => {
    return (
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)
    );
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    try {
      return format(new Date(dateString), "d 'de' MMM, yyyy", { locale: ptBR });
    } catch (e) {
      return "Data inválida";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00e5ff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#00e5ff]/10 rounded-xl flex items-center justify-center border border-[#00e5ff]/20">
                  <User className="h-5 w-5 text-[#00e5ff]" />
                </div>
                <span className="font-serif font-bold text-xl text-white">
                  Meus Clientes
                </span>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90 border-none shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                  <Plus className="h-4 w-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white font-serif">
                    {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Nome *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome da cliente"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#00e5ff]/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#00e5ff]/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Telefone</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#00e5ff]/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Anotações</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Preferências, alergias, detalhes..."
                      rows={3}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#00e5ff]/50"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90">
                    {editingClient ? 'Salvar Alterações' : 'Adicionar Cliente'}
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
            <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#00e5ff]/50 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Client List */}
        <div className="space-y-4">
          {loadingClients ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00e5ff]"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            /* Empty State */
            /* Empty State */
            <EmptyState
              icon={Star}
              title={searchTerm ? 'Nenhum resultado encontrado' : 'Sua lista de estrelas está vazia'}
              description={searchTerm ? 'Tente buscar por outro termo.' : 'Adicione seu primeiro cliente para começar a organizar seu império.'}
              actionLabel={!searchTerm ? 'Adicionar Primeiro Cliente' : undefined}
              onAction={!searchTerm ? () => setIsDialogOpen(true) : undefined}
            />
          ) : (
            /* Data Table */
            /* Data Table (Desktop) & Cards (Mobile) */
            <div className="space-y-4">
              {/* Desktop Table - Hidden on Mobile */}
              <div className="hidden md:block bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-white/60">Cliente</TableHead>
                      <TableHead className="text-white/60">Contato</TableHead>
                      <TableHead className="text-white/60">Última Visita</TableHead>
                      <TableHead className="text-white/60 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="border-white/10 hover:bg-white/5 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-white/10">
                              <AvatarImage src={client.avatar_url || ''} />
                              <AvatarFallback className="bg-white/10 text-white/70">
                                {client.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-white">{client.name}</span>
                              {client.email && (
                                <span className="text-xs text-white/50">{client.email}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.phone ? (
                            <div className="flex items-center gap-2 text-sm text-white/70 bg-white/5 px-2 py-1 rounded-md w-fit">
                              <Phone className="h-3 w-3 text-[#00e5ff]" />
                              <span>{client.phone}</span>
                            </div>
                          ) : (
                            <span className="text-white/30 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(client.last_visit)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white">
                              <DropdownMenuItem className="focus:bg-white/10 focus:text-white" onClick={() => navigate(`/clientes/${client.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem className="focus:bg-white/10 focus:text-white" onClick={() => openEditDialog(client)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                                onClick={() => handleDelete(client.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards - Visible on Mobile only */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredClients.map((client) => (
                  <div key={client.id} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-sm relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-white/10">
                          <AvatarImage src={client.avatar_url || ''} />
                          <AvatarFallback className="bg-white/10 text-white/70">
                            {client.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-white text-lg">{client.name}</h3>
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-white/70 mt-1">
                              <Phone className="h-3 w-3 text-[#00e5ff]" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-white/60 hover:text-white hover:bg-white/10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white z-50">
                          <DropdownMenuItem className="focus:bg-white/10 focus:text-white" onClick={() => navigate(`/clientes/${client.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-white/10 focus:text-white" onClick={() => openEditDialog(client)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-sm text-white/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span> {formatDate(client.last_visit)}</span>
                      </div>
                      {client.email && (
                        <span className="truncate max-w-[150px]">{client.email}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
