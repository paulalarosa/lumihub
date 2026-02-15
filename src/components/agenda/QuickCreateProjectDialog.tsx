import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from '@/hooks/use-toast';
import { FolderPlus } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface QuickCreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (project: { id: string; name: string; client_id: string }) => void;
  preselectedClientId?: string;
  clients: Client[];
}

export function QuickCreateProjectDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedClientId,
  clients
}: QuickCreateProjectDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [eventDate, setEventDate] = useState('');

  useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId);
    }
  }, [preselectedClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !clientId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          client_id: clientId,
          name: name.trim(),
          event_date: eventDate || null
        })
        .select('id, name, client_id')
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Projeto criado"
      });

      onSuccess(data);
      setName('');
      setClientId('');
      setEventDate('');
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível criar o projeto";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Novo Projeto Rápido
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nome do Projeto *</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Casamento Maria & João"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={clientId || "__none__"} onValueChange={(v) => setClientId(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Selecione...</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-date">Data do Evento</Label>
            <Input
              id="project-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !clientId}>
              {loading ? 'Criando...' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
