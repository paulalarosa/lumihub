import { Card, CardContent } from '@/components/ui/card';

export default function AdminLogs() {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-white font-serif text-xl font-bold mb-4">Logs de Erro do Sistema</h3>
          <p className="text-slate-400">
            Sistema de logs em desenvolvimento. Será integrado com Sentry ou similar para rastreamento de erros em produção.
          </p>
          <div className="mt-6 space-y-2">
            <p className="text-slate-400 text-sm">Funcionalidades planejadas:</p>
            <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
              <li>Visualização de erros em tempo real</li>
              <li>Filtros por tipo, severidade, data</li>
              <li>Stack traces detalhados</li>
              <li>Alertas para erros críticos</li>
              <li>Exportação de relatórios</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
