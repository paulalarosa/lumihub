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
import { Client } from '@/types/database';
import { Plus } from 'lucide-react';

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
  const [clients, setClients] = useState<Client[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    deadline: '',
    budget: '',
    description: '',
    status: 'planning',
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

      setClients((data as any) || []);
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

    // Validação de budget (apenas números positivos)
    if (name === 'budget') {
      if (value && !/^\d+(\.\d{0,2})?$/.test(value)) {
        return; // Ignora valores inválidos
      }
    }

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
    // Nome obrigatório
    if (!formData.name.trim()) {
      toast({
        title: 'Erro de Validação',
        description: 'O nome do projeto é obrigatório.',
        variant: 'destructive',
      });
      return false;
    }

    // Cliente obrigatório
    if (!formData.client_id) {
      toast({
        title: 'Erro de Validação',
        description: 'Selecione um cliente.',
        variant: 'destructive',
      });
      return false;
    }

    // Validação de deadline (não pode ser no passado)
    if (formData.deadline) {
      const selectedDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        toast({
          title: 'Erro de Validação',
          description: 'A data limite não pode ser no passado.',
          variant: 'destructive',
        });
        return false;
      }
    }

    // Validação de budget (deve ser positivo)
    if (formData.budget && parseFloat(formData.budget) <= 0) {
      toast({
        title: 'Erro de Validação',
        description: 'O orçamento deve ser maior que zero.',
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

      // Preparar dados para insert
      const newProject = {
        name: formData.name.trim(),
        client_id: formData.client_id,
        user_id: user.id,
        deadline: formData.deadline || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        description: formData.description.trim() || null,
        status: formData.status,
      };

      // Insert no Supabase
      const { error } = await supabase
        .from('projects')
        .insert([newProject]);

      if (error) {
        throw error;
      }

      // Sucesso
      const clientName = clients.find((c) => c.id === formData.client_id)?.name;
      toast({
        title: 'Projeto Criado',
        description: `${formData.name} foi adicionado com sucesso para ${clientName}.`,
      });

      // Reset form
      setFormData({
        name: '',
        client_id: '',
        deadline: '',
        budget: '',
        description: '',
        status: 'planning',
      });

      // Fechar dialog
      setOpen(false);

      // Chamar callback
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
                placeholder="Website Redesign"
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

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Descrição do projeto..."
                value={formData.description}
                onChange={handleInputChange}
                disabled={loading}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Grid de 2 colunas para Deadline e Budget */}
            <div className="grid grid-cols-2 gap-4">
              {/* Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline">Data Limite</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget">Orçamento</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">
                    R$
                  </span>
                  <Input
                    id="budget"
                    name="budget"
                    type="text"
                    placeholder="0.00"
                    value={formData.budget}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Status (hidden, sempre 'planning') */}
            <input
              type="hidden"
              name="status"
              value={formData.status}
            />

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
