import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, XCircle, RefreshCw } from "lucide-react";

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  details?: string;
}

export default function DebugConnection() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnostics: TestResult[] = [];

    // 1. Teste de Autenticação
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();

      if (authError) {
        diagnostics.push({
          name: 'Autenticação',
          success: false,
          message: 'Erro ao obter sessão',
          details: authError.message,
        });
      } else if (session) {
        diagnostics.push({
          name: 'Autenticação',
          success: true,
          message: 'Usuário autenticado',
          details: `Email: ${session.user.email}`,
        });
      } else {
        diagnostics.push({
          name: 'Autenticação',
          success: true,
          message: 'Nenhum usuário logado',
          details: 'Você pode estar em modo anônimo ou sem sessão',
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'Autenticação',
        success: false,
        message: 'Exceção ao testar autenticação',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    // 2. Teste de Leitura de Dados
    try {
      const { count, error } = await supabase
        .from('wedding_clients')
        .select('*', { count: 'exact', head: true });

      if (error) {
        diagnostics.push({
          name: 'Leitura de Dados (Clientes)',
          success: false,
          message: 'Erro ao ler dados da tabela clients',
          details: `${error.code}: ${error.message}`,
        });
      } else {
        diagnostics.push({
          name: 'Leitura de Dados (Clientes)',
          success: true,
          message: 'Tabela de clientes acessível',
          details: `Total de clientes: ${count ?? 0}`,
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'Leitura de Dados (Clientes)',
        success: false,
        message: 'Exceção ao tentar ler dados',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    // 3. Teste de Relação: Eventos -> Clientes
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, clients(id)')
        .limit(1);

      if (error) {
        diagnostics.push({
          name: 'Relação: Eventos → Clientes',
          success: false,
          message: 'Erro de Configuração: Relação entre tabelas não encontrada',
          details: `${error.code}: ${error.message}`,
        });
      } else {
        diagnostics.push({
          name: 'Relação: Eventos → Clientes',
          success: true,
          message: 'Relacionamento configurado corretamente',
          details: `Consulta aceita (${data?.length ?? 0} registros retornados)`,
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'Relação: Eventos → Clientes',
        success: false,
        message: 'Exceção ao testar relacionamento',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    // 4. Teste de Relação: Projetos -> Clientes
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, clients(id)')
        .limit(1);

      if (error) {
        diagnostics.push({
          name: 'Relação: Projetos → Clientes',
          success: false,
          message: 'Erro de Configuração: Relação entre tabelas não encontrada',
          details: `${error.code}: ${error.message}`,
        });
      } else {
        diagnostics.push({
          name: 'Relação: Projetos → Clientes',
          success: true,
          message: 'Relacionamento configurado corretamente',
          details: `Consulta aceita (${data?.length ?? 0} registros retornados)`,
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'Relação: Projetos → Clientes',
        success: false,
        message: 'Exceção ao testar relacionamento',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    // 5. Teste de Storage
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        diagnostics.push({
          name: 'Storage',
          success: false,
          message: 'Erro ao listar buckets',
          details: error.message,
        });
      } else {
        const moodboardBucket = buckets?.find(
          (b) => b.name === 'moodboard_images'
        );

        if (moodboardBucket) {
          diagnostics.push({
            name: 'Storage',
            success: true,
            message: 'Bucket moodboard_images encontrado',
            details: `Total de buckets: ${buckets?.length ?? 0}`,
          });
        } else {
          diagnostics.push({
            name: 'Storage',
            success: false,
            message: 'Bucket moodboard_images não encontrado',
            details: `Buckets disponíveis: ${buckets?.map((b) => b.name).join(', ') ?? 'nenhum'}`,
          });
        }
      }
    } catch (error) {
      diagnostics.push({
        name: 'Storage',
        success: false,
        message: 'Exceção ao testar storage',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    setResults(diagnostics);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            🔍 Diagnóstico do Sistema
          </h1>
          <p className="text-slate-600">
            Verifique a integridade de autenticação, banco de dados e relacionamentos
          </p>
        </div>

        {/* Status Summary */}
        {results.length > 0 && (
          <Card className="mb-6 p-6 bg-white border-slate-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Status Geral</p>
                <p className="text-2xl font-bold text-slate-900">
                  {successCount}/{totalCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Sucesso</p>
                <p className="text-2xl font-bold text-green-600">
                  {successCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Falhas</p>
                <p className="text-2xl font-bold text-red-600">
                  {totalCount - successCount}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Results List */}
        <div className="space-y-4 mb-8">
          {loading ? (
            <Card className="p-8 text-center bg-white border-slate-200">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-slate-600">
                  Executando diagnóstico...
                </span>
              </div>
            </Card>
          ) : results.length === 0 ? (
            <Card className="p-8 text-center bg-white border-slate-200">
              <p className="text-slate-600">
                Clique no botão abaixo para iniciar o diagnóstico
              </p>
            </Card>
          ) : (
            results.map((result, idx) => (
              <Card
                key={idx}
                className={`p-6 bg-white border-l-4 transition-all ${result.success
                    ? 'border-l-green-500 border-slate-200'
                    : 'border-l-red-500 border-slate-200'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {result.success ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {result.name}
                    </h3>
                    <p
                      className={`text-sm mb-2 ${result.success
                          ? 'text-green-700'
                          : 'text-red-700'
                        }`}
                    >
                      {result.message}
                    </p>
                    {result.details && (
                      <div className="bg-slate-50 rounded p-3 text-xs font-mono text-slate-700 break-all">
                        {result.details}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={runDiagnostics}
            disabled={loading}
            className="gap-2"
            size="lg"
          >
            <RefreshCw className="w-4 h-4" />
            {loading
              ? 'Executando...'
              : 'Rodar Diagnóstico Novamente'}
          </Button>
        </div>

        {/* Footer Info */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">
            💡 O que cada teste verifica:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <strong>Autenticação:</strong> Se você está logado no Supabase
            </li>
            <li>
              <strong>Leitura de Dados:</strong> Acesso à tabela de clientes
            </li>
            <li>
              <strong>Relações:</strong> Se os Foreign Keys estão configurados entre tabelas
            </li>
            <li>
              <strong>Storage:</strong> Acesso aos buckets de arquivos
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}