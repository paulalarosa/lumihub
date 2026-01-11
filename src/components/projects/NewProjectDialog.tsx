import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

// Minimal client type for the dropdown
interface ClientOption {
  id: string;
  name: string;
}

interface NewProjectDialogProps {
  onSuccess: () => void;
  onCreateClient?: () => void;
}

export function NewProjectDialog({
  onSuccess,
  onCreateClient,
}: NewProjectDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    event_date: '',
    event_location: '',
    event_type: '',
    notes: '',
    status: 'active',
  });

  // Carregar clientes ao abrir o modal
  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você não está autenticado.',
          variant: 'destructive',
        });
        setLoadingClients(false);
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro ao Carregar Clientes',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClientChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      client_id: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro de Validação',
        description: 'O nome do projeto é obrigatório.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.client_id) {
      toast({
        title: 'Erro de Validação',
        description: 'Selecione um cliente.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        toast({
          title: 'Erro de Autenticação',
          description: 'Usuário não autenticado. Faça login e tente novamente.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Preparar dados para insert (matching actual DB columns)
      const newProject = {
        name: formData.name.trim(),
        client_id: formData.client_id,
        user_id: user.id,
        event_date: formData.event_date || null,
        event_location: formData.event_location.trim() || null,
        event_type: formData.event_type.trim() || null,
        notes: formData.notes.trim() || null,
        status: formData.status,
      };

      const { error } = await supabase
        .from('projects')
        .insert([newProject]);

      if (error) {
        throw error;
      }

      const clientName = clients.find((c) => c.id === formData.client_id)?.name;
      toast({
        title: 'Projeto Criado',
        description: `${formData.name} foi adicionado com sucesso para ${clientName}.`,
      });

      // Reset form
      setFormData({
        name: '',
        client_id: '',
        event_date: '',
        event_location: '',
        event_type: '',
        notes: '',
        status: 'active',
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast({
        title: 'Erro ao Criar Projeto',
        description:
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro ao salvar o projeto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
          <DialogDescription>
            Crie um novo projeto para um cliente.
          </DialogDescription>
        </DialogHeader>

        {loadingClients ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-slate-600">Carregando clientes...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-600 mb-4">
              Nenhum cliente encontrado. Crie um cliente primeiro.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                onCreateClient?.();
              }}
            >
              + Criar Cliente
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome do Projeto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Casamento Maria & João"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="client_id">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.client_id}
                onValueChange={handleClientChange}
                disabled={loading}
              >
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Evento */}
            <div className="space-y-2">
              <Label htmlFor="event_type">Tipo de Evento</Label>
              <Input
                id="event_type"
                name="event_type"
                placeholder="Casamento, Formatura, etc."
                value={formData.event_type}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            {/* Grid de 2 colunas para Data e Local */}
            <div className="grid grid-cols-2 gap-4">
              {/* Data do Evento */}
              <div className="space-y-2">
                <Label htmlFor="event_date">Data do Evento</Label>
                <Input
                  id="event_date"
                  name="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              {/* Local */}
              <div className="space-y-2">
                <Label htmlFor="event_location">Local</Label>
                <Input
                  id="event_location"
                  name="event_location"
                  placeholder="Local do evento"
                  value={formData.event_location}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Observações sobre o projeto..."
                value={formData.notes}
                onChange={handleInputChange}
                disabled={loading}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Criar Projeto'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
