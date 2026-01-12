import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProjectKanban } from '@/components/project/ProjectKanban';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, User, CheckCircle, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Client, Project, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types/database';

const STATUS_ICONS = {
  planning: <Clock className="w-4 h-4" />,
  in_progress: <Clock className="w-4 h-4" />,
  on_hold: <Clock className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
  cancelled: <Clock className="w-4 h-4" />,
};

export default function ProjectDetails() {
  const { id: projectId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
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

        setProject(data as any);
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

  const client = project.clients as unknown as Client;
  const paidAmount = project.paid_amount || 0;
  const remainingBudget = project.budget - paidAmount;
  const percentagePaid = (paidAmount / project.budget) * 100;

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
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm ${
                  PROJECT_STATUS_COLORS[project.status]
                }`}
              >
                {STATUS_ICONS[project.status]}
                {PROJECT_STATUS_LABELS[project.status]}
              </div>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              {/* Deadline */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Prazo</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {format(new Date(project.deadline), 'dd MMMM yyyy', {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              {/* Budget */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Orçamento</p>
                  <p className="text-lg font-semibold text-gray-900">
                    R$ {project.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
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
            <TabsTrigger value="briefing" className="data-[state=active]:bg-blue-50">
              Briefing
            </TabsTrigger>
            <TabsTrigger value="contract" className="data-[state=active]:bg-blue-50">
              Contrato
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Budget Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">Orçamento Total</h3>
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  R$ {project.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500">Valor total do projeto</p>
              </div>

              {/* Received Payment Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">Valor Recebido</h3>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500">
                  {percentagePaid.toFixed(1)}% do orçamento
                </p>
              </div>

              {/* Remaining Budget Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">A Receber</h3>
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-orange-600 mb-2">
                  R$ {remainingBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500">
                  {(100 - percentagePaid).toFixed(1)}% pendente
                </p>
              </div>
            </div>

            {/* Payment Progress */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Progresso de Pagamento</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                        style={{ width: `${percentagePaid}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                    {percentagePaid.toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Recebido</p>
                    <p className="font-semibold text-gray-900">
                      R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Restante</p>
                    <p className="font-semibold text-gray-900">
                      R$ {remainingBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ProjectKanban projectId={projectId!} />
          </TabsContent>

          {/* Briefing Tab */}
          <TabsContent value="briefing" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {project.briefing && Object.keys(project.briefing).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(project.briefing).map(([key, value]) => (
                  <div key={key} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <h3 className="font-semibold text-gray-900 mb-2 capitalize">
                      {key.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum briefing foi adicionado ainda.</p>
              </div>
            )}
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
