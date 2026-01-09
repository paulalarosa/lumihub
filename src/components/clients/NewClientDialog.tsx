import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Client } from '@/types/database';

interface NewClientDialogProps {
  onSuccess: () => void;
}

export function NewClientDialog({ onSuccess }: NewClientDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    status: 'lead' as 'active' | 'inactive' | 'lead',
    notes: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value as 'active' | 'inactive' | 'lead',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação: Nome é obrigatório
    if (!formData.name.trim()) {
      toast({
        title: 'Erro de Validação',
        description: 'O nome do cliente é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Obter usuário logado
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast({
          title: 'Erro de Autenticação',
          description: 'Usuário não autenticado. Faça login e tente novamente.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Preparar dados para insert
      const newClient: Omit<Client, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        company_name: formData.company_name.trim() || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
        user_id: user.id,
      };

      // Insert no Supabase
      const { error } = await supabase.from('clients').insert([newClient]);

      if (error) {
        throw error;
      }

      // Sucesso
      toast({
        title: 'Cliente Criado',
        description: `${formData.name} foi adicionado com sucesso.`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        status: 'lead',
        notes: '',
      });

      // Fechar dialog
      setOpen(false);

      // Chamar callback
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: 'Erro ao Criar Cliente',
        description:
          error instanceof Error
            ? error.message
            : 'Ocorreu um erro ao salvar o cliente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Novo Cliente</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Adicione um novo cliente ao seu sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="João Silva"
              value={formData.name}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="joao@example.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <Label htmlFor="company_name">Empresa</Label>
            <Input
              id="company_name"
              name="company_name"
              placeholder="Acme Corporation"
              value={formData.company_name}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger id="status" disabled={loading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Adicione observações sobre o cliente..."
              value={formData.notes}
              onChange={handleInputChange}
              disabled={loading}
              rows={3}
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
              {loading ? 'Salvando...' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
