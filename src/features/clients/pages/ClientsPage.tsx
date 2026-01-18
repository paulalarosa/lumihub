import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ArrowLeft,
  Plus,
  Search,
  User,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Star,
  Link as LinkIcon,
  Gem // Replacing Ring
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
import { ClientService } from '@/services/clientService';
import { MobileFAB } from '@/components/ui/MobileFAB';
import { ClientForm, ClientFormData } from '../components/ClientForm';

// Extended Client interface
interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  notes: string | null;
  last_visit: string | null;
  created_at: string;
  user_id: string;
  bride_status?: boolean;
  wedding_date?: string | null;
  secret_code?: string | null;
}

export default function Clientes() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { organizationId, loading: orgLoading } = useOrganization();
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (organizationId) {
      fetchClients();
    }
  }, [organizationId]);

  const fetchClients = async () => {
    if (!organizationId) return;
    setLoadingClients(true);

    const { data, error } = await ClientService.list(organizationId);

    if (error) {
      toast({ title: "Erro ao carregar clientes", variant: "destructive" });
    } else {
      setClients((data as any) || []);
    }
    setLoadingClients(false);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (formData: ClientFormData) => {
    if (!organizationId) {
      toast({ title: "Erro de organização", variant: "destructive" });
      return;
    }

    setLoadingClients(true);

    const clientData = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      notes: formData.notes.trim() || null,
      user_id: organizationId,
      bride_status: Boolean(formData.bride_status),
      // Force NULL if date is empty, undefined or invalid
      wedding_date: formData.wedding_date ? new Date(formData.wedding_date).toISOString() : null,
      // Force NULL if secret_code is empty string or just whitespace (and ensure String type)
      secret_code: formData.secret_code ? String(formData.secret_code).trim() || null : null,
    };


    try {
      if (editingClient) {
        const { error } = await ClientService.update(editingClient.id, clientData);

        if (error) throw error;
        toast({ title: "Cliente atualizado!" });
      } else {
        const { error } = await ClientService.create(clientData);

        if (error) throw error;
        toast({ title: "Cliente adicionado!" });
      }

      setIsDialogOpen(false);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
      toast({ title: "Erro ao salvar cliente", variant: "destructive" });
    } finally {
      setLoadingClients(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    const { error } = await ClientService.delete(id);

    if (error) {
      toast({ title: "Erro ao excluir cliente", variant: "destructive" });
    } else {
      toast({ title: "Cliente excluído!" });
      fetchClients();
    }
  };

  const copyPortalLink = (clientId: string) => {
    const link = `${window.location.origin}/portal/${clientId}/login`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link do Portal copiado!" });
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

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00e5ff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col font-mono selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-white/20 bg-black">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white hover:text-black rounded-none">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white flex items-center justify-center">
                  <User className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl text-white tracking-tight">
                    MEUS CLIENTES
                  </h1>
                  <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-mono">
                    /// DATABASE ACCESS
                  </div>
                </div>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingClient(null);
            }}>
              <DialogTrigger asChild>
                <Button className="rounded-none bg-white text-black hover:bg-gray-300 font-mono text-xs uppercase tracking-widest h-10 px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-black border border-white p-6 rounded-none text-white">
                <DialogHeader>
                  <DialogTitle className="text-white font-serif text-2xl">
                    {editingClient ? 'EDITAR CLIENTE' : 'NOVO CLIENTE'}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Formulário para gerenciamento de dados do cliente.
                  </DialogDescription>
                </DialogHeader>
                <ClientForm
                  onSubmit={handleFormSubmit}
                  initialData={editingClient ? {
                    name: editingClient.name,
                    email: editingClient.email || '',
                    phone: editingClient.phone || '',
                    notes: editingClient.notes || '',
                    bride_status: editingClient.bride_status || false,
                    wedding_date: editingClient.wedding_date ? new Date(editingClient.wedding_date) : undefined,
                    secret_code: editingClient.secret_code || ''
                  } : undefined}
                  submitLabel={editingClient ? 'SALVAR DADOS' : 'REGISTRAR CLIENTE'}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-4 h-4 w-4 text-white/40" />
            <Input
              placeholder="BUSCAR NO SISTEMA..."
              className="pl-12 bg-black border border-white/20 text-white placeholder:text-white/30 focus:border-white rounded-none h-12 font-mono text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Client List */}
        <div className="space-y-4">
          {loadingClients ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border border-white/20 border-t-white animate-spin rounded-full" />
                <span className="font-mono text-xs uppercase tracking-widest text-white/50">Carregando Dados...</span>
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            /* Empty State */
            <EmptyState
              icon={Star}
              title={searchTerm ? 'REGISTRO NÃO ENCONTRADO' : 'DATABASE VAZIO'}
              description={searchTerm ? 'Verifique os termos de busca.' : 'Inicie o cadastro de clientes para popular o sistema.'}
              actionLabel={!searchTerm ? 'INICIAR CADASTRO' : undefined}
              onAction={!searchTerm ? () => setIsDialogOpen(true) : undefined}
              className="border border-white/10 rounded-none bg-black"
            />
          ) : (
            /* Data Table */
            <div className="space-y-6">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white hover:bg-transparent">
                      <TableHead className="text-white font-mono text-[10px] uppercase tracking-widest h-12">Cliente</TableHead>
                      <TableHead className="text-white font-mono text-[10px] uppercase tracking-widest h-12">Contato</TableHead>
                      <TableHead className="text-white font-mono text-[10px] uppercase tracking-widest h-12">Última Visita</TableHead>
                      <TableHead className="text-white font-mono text-[10px] uppercase tracking-widest h-12 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="border-b border-white/10 hover:bg-white hover:text-black group transition-colors duration-0">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-white/20 rounded-none group-hover:border-black">
                              <AvatarImage src={client.avatar_url || ''} />
                              <AvatarFallback className="bg-white/10 text-white rounded-none group-hover:bg-black group-hover:text-white font-mono">
                                {client.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm uppercase font-bold">{client.name}</span>
                                {client.bride_status && (
                                  <Gem className="h-3 w-3 text-[#00e5ff] group-hover:text-black" />
                                )}
                              </div>
                              {client.email && (
                                <span className="text-xs text-gray-500 font-mono group-hover:text-black/60">{client.email}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.phone ? (
                            <span className="font-mono text-xs">{client.phone}</span>
                          ) : (
                            <span className="text-gray-600 group-hover:text-black/40 text-xs font-mono">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="w-2 h-2 bg-gray-600 group-hover:bg-black" />
                            {formatDate(client.last_visit)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Actions Dropdown or Buttons */}
                            {client.bride_status && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyPortalLink(client.id)}
                                className="h-8 w-8 p-0 rounded-none text-white hover:bg-black hover:text-white group-hover:text-black group-hover:hover:bg-black group-hover:hover:text-white"
                                title="Copiar Link do Portal"
                              >
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/clientes/${client.id}`)}
                              className="h-8 w-8 p-0 rounded-none text-white hover:bg-black hover:text-white group-hover:text-black group-hover:hover:bg-black group-hover:hover:text-white"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(client)}
                              className="h-8 w-8 p-0 rounded-none text-white hover:bg-black hover:text-white group-hover:text-black group-hover:hover:bg-black group-hover:hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client.id)}
                              className="h-8 w-8 p-0 rounded-none text-red-500 hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredClients.map((client) => (
                  <div key={client.id} className="bg-black border border-white/20 p-6 rounded-none relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border border-white rounded-none">
                          <AvatarImage src={client.avatar_url || ''} />
                          <AvatarFallback className="bg-black text-white font-mono rounded-none border border-white/20">
                            {client.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif text-xl text-white">{client.name}</h3>
                            {client.bride_status && <Gem className="h-4 w-4 text-[#00e5ff]" />}
                          </div>
                          {client.phone && (
                            <div className="font-mono text-xs text-gray-500 mt-1">
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </div>

                      {client.bride_status && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-black border-white/20 rounded-none text-white">
                            <DropdownMenuItem onClick={() => copyPortalLink(client.id)}>
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Copiar Link Portal
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                      <Button
                        variant="outline"
                        className="rounded-none border-white/20 text-xs font-mono uppercase h-10 hover:bg-white hover:text-black"
                        onClick={() => navigate(`/clientes/${client.id}`)}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-none border-white/20 text-xs font-mono uppercase h-10 hover:bg-white hover:text-black"
                        onClick={() => openEditDialog(client)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-none border-red-900 text-red-500 text-xs font-mono uppercase h-10 hover:bg-red-600 hover:text-white hover:border-red-600"
                        onClick={() => handleDelete(client.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <MobileFAB onClick={() => setIsDialogOpen(true)} label="Novo Cliente" />
    </div>
  );
}
