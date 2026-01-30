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
import { Plus, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Minimal client type for the dropdown
interface ClientOption {
  id: string;
  name: string;
  email?: string | null;
}

interface NewProjectDialogProps {
  onSuccess: () => void;
  onCreateClient?: () => void;
}

// 1. Zod Schema Definition (As requested)
const createProjectSchema = z.object({
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  client_id: z.string().min(1, "Selecione um cliente"),
  // Enforcing that we have a client email for the project
  client_email: z.string()
    .min(1, "O e-mail do cliente é obrigatório para envio de notificações")
    .email("E-mail do cliente inválido"),
  event_date: z.string().optional(),
  event_location: z.string().optional(),
  event_type: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived', 'lead']).default('active'),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

export function NewProjectDialog({
  onSuccess,
  onCreateClient,
}: NewProjectDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);

  // 2. React Hook Form Setup
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      client_id: '',
      client_email: '', // Will be set automatically when client is selected
      event_date: '',
      event_location: '',
      event_type: '',
      notes: '',
      status: 'active',
    },
  });

  const selectedClientId = watch('client_id');

  // Load clients on open
  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  // Update client_email when client_id changes
  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const selectedClient = clients.find(c => c.id === selectedClientId);
      if (selectedClient?.email) {
        setValue('client_email', selectedClient.email, { shouldValidate: true });
      } else {
        setValue('client_email', '', { shouldValidate: true });
      }
    }
  }, [selectedClientId, clients, setValue]);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('wedding_clients')
        .select('id, name, email')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      setClients((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de clientes.',
        variant: 'destructive',
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const onSubmit = async (data: CreateProjectFormData) => {
    if (!user) return;

    try {
      // ✅ 1. Create the project first (Secure Code Pattern)
      const newProject = {
        name: data.name.trim(),
        client_id: data.client_id,
        user_id: user.id,
        event_date: data.event_date || null,
        event_location: data.event_location?.trim() || null,
        event_type: data.event_type || null,
        notes: data.notes?.trim() || null,
        status: data.status,
      };

      const { data: projectData, error: dbError } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (dbError) throw dbError;

      // ✅ 2. Try to send email, but IGNORA failures (Safe for Localhost)
      try {
        if (!data.client_email) {
          console.warn("⚠️ Localhost/Dev: Projeto criado sem e-mail válido (Ignorado).");
        } else {
          // Calling the Edge Function to send welcome email
          const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
            body: {
              record: {
                ...projectData,
                client_email: data.client_email // Explicitly passing email
              }
            }
          });

          if (emailError) throw emailError;
        }
      } catch (emailError) {
        // AQUI É O PULO DO GATO: A gente apenas loga o erro, não trava o app
        console.error("❌ Falha no envio de e-mail (Não crítico):", emailError);
        // Optional: toast warning
        // toast({ title: "Aviso", description: "Projeto criado, mas houve erro no envio do e-mail.", variant: "warning" });
      }

      toast({
        title: 'Projeto Criado',
        description: `${data.name} foi criado com sucesso.`,
      });

      reset();
      setOpen(false);
      onSuccess();

    } catch (error: any) {
      console.error('Erro crítico ao criar projeto:', error);
      toast({
        title: 'Erro ao Criar Projeto',
        description: error.message || 'Ocorreu um erro ao salvar o projeto.',
        variant: 'destructive',
      });
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
      <DialogContent className="max-w-lg bg-[#1a1a1a] border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Novo Projeto</DialogTitle>
          <DialogDescription className="text-gray-400">
            Crie um novo projeto. O e-mail do cliente será validado automaticamente.
          </DialogDescription>
        </DialogHeader>

        {loadingClients ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#00e5ff]" />
          </div>
        ) : clients.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-400 mb-4">
              Nenhum cliente encontrado. Crie um cliente primeiro.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                onCreateClient?.();
              }}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
            >
              + Criar Cliente
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Nome do Projeto <span className="text-red-500">*</span>
              </Label>
              <Input
                {...control.register("name")}
                placeholder="Casamento Maria & João"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/50 focus:ring-white/50"
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="client_id" className="text-gray-300">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="client_id"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.client_id && <p className="text-xs text-red-400">{errors.client_id.message}</p>}

              {/* Hidden Email Validation Feedback */}
              <input type="hidden" {...control.register("client_email")} />
              {errors.client_email && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  ⚠️ {errors.client_email.message} (Atualize o cadastro do cliente)
                </p>
              )}
            </div>

            {/* Tipo de Evento */}
            <div className="space-y-2">
              <Label className="text-gray-300">Tipo de Evento</Label>
              <Controller
                control={control}
                name="event_type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                      <SelectItem value="noivas">Noivas</SelectItem>
                      <SelectItem value="pre_wedding">Pré Wedding</SelectItem>
                      <SelectItem value="producoes_sociais">Produções Sociais</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Grid de 2 colunas para Data e Local */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Data do Evento</Label>
                <Input
                  type="date"
                  {...control.register("event_date")}
                  className="bg-white/5 border-white/10 text-white focus:border-white/50 focus:ring-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Local</Label>
                <Input
                  {...control.register("event_location")}
                  placeholder="Local do evento"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/50 focus:ring-white/50"
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label className="text-gray-300">Notas</Label>
              <textarea
                {...control.register("notes")}
                placeholder="Observações sobre o projeto..."
                rows={3}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-white hover:bg-white/90 text-black">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSubmitting ? 'Salvando...' : 'Criar Projeto'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
