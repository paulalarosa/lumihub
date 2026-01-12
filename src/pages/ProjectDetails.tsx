import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProjectKanban } from '@/components/project/ProjectKanban';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, User, CheckCircle, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';
import { ProjectStatus, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types/database';

interface ProjectWithClient extends Tables<'projects'> {
  clients?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <Clock className="w-4 h-4" />,
  planning: <Clock className="w-4 h-4" />,
  in_progress: <Clock className="w-4 h-4" />,
  on_hold: <Clock className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
  cancelled: <Clock className="w-4 h-4" />,
};

export default function ProjectDetails() {
  const { id: projectId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [project, setProject] = useState<ProjectWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*, clients(id, name, email)')
          .eq('id', projectId)
          .single();

        if (error) throw error;

        setProject(data as ProjectWithClient);
      } catch (error) {
        console.error('Erro ao buscar projeto:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o projeto.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Projeto não encontrado</h1>
          <p className="text-gray-600 mb-6">O projeto solicitado não existe.</p>
          <Link
            to="/projetos"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar aos Projetos
          </Link>
        </div>
      </div>
    );
  }

  const client = project.clients;
  const status = (project.status || 'active') as ProjectStatus;
  const statusLabel = PROJECT_STATUS_LABELS[status] || project.status;
  const statusColor = PROJECT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  const statusIcon = STATUS_ICONS[status] || <Clock className="w-4 h-4" />;

  // Use event_date as deadline since deadline column doesn't exist
  const eventDate = project.event_date;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Top Row: Title + Status Badge */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.name}</h1>
                {client && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{client.name}</span>
                  </div>
                )}
              </div>

              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm ${statusColor}`}
              >
                {statusIcon}
                {statusLabel}
              </div>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              {/* Event Date */}
              {eventDate && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data do Evento</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {format(new Date(eventDate), 'dd MMMM yyyy', {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Location */}
              {project.event_location && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Local</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {project.event_location}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-50">
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="contract" className="data-[state=active]:bg-blue-50">
              Contrato
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informações do Projeto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-semibold text-gray-900">{statusLabel}</p>
                </div>
                {project.event_type && (
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Evento</p>
                    <p className="font-semibold text-gray-900">{project.event_type}</p>
                  </div>
                )}
                {eventDate && (
                  <div>
                    <p className="text-sm text-gray-500">Data do Evento</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(eventDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
                {project.event_location && (
                  <div>
                    <p className="text-sm text-gray-500">Local</p>
                    <p className="font-semibold text-gray-900">{project.event_location}</p>
                  </div>
                )}
              </div>
              {project.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Notas</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{project.notes}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ProjectKanban projectId={projectId!} />
          </TabsContent>

          {/* Contract Tab */}
          <TabsContent value="contract" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contrato do Projeto</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Crie, edite e assine o contrato deste projeto de forma digital e segura.
              </p>
              <Link
                to={`/projects/${projectId}/contract`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FileText className="w-5 h-5" />
                Abrir Contrato
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
