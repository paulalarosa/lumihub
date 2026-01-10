import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskData {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  is_completed: boolean;
  due_date?: string | null;
  sort_order: number;
  visibility: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

type TaskPriority = 'low' | 'medium' | 'high';

interface NewTaskDialogProps {
  projectId: string;
  onTaskCreated: (task: TaskData) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTaskDialog({
  projectId,
  onTaskCreated,
  isOpen,
  onOpenChange,
}: NewTaskDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTask = async () => {
    if (!title.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha o título da tarefa.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: title.trim(),
          description: '',
          is_completed: false,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tarefa criada com sucesso.',
      });

      onTaskCreated(data as TaskData);
      setTitle('');
      setPriority('medium');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tarefa.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateTask();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
          <DialogDescription>
            Adicione uma nova tarefa ao projeto. Ela começará na coluna "A Fazer".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Implementar login com Google"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Priority Select */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Prioridade
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateTask}
            disabled={isLoading || !title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Criando...
              </>
            ) : (
              'Criar Tarefa'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
