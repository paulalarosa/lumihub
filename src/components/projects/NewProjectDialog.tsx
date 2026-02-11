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
import { Controller } from 'react-hook-form';
import { useNewProjectDialog } from './hooks/useNewProjectDialog';

interface NewProjectDialogProps {
  onSuccess: () => void;
  onCreateClient?: () => void;
}

export function NewProjectDialog({
  onSuccess,
  onCreateClient,
}: NewProjectDialogProps) {
  const {
    open,
    setOpen,
    loadingClients,
    clients,
    form: {
      control,
      handleSubmit,
      formState: { errors, isSubmitting }
    },
    onSubmit,
  } = useNewProjectDialog({ onSuccess });

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
