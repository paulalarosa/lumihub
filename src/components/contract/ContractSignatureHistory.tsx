import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, FileText } from 'lucide-react';
import { ContractSignature } from '@/types/database';

export function ContractSignatureHistory({ projectId }: { projectId: string }) {
  const [signatures, setSignatures] = useState<ContractSignature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignatures = async () => {
      try {
        const { data, error } = await supabase
          .from('contract_signatures')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSignatures(data || []);
      } catch (error) {
        console.error('Erro ao buscar assinaturas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSignatures();
  }, [projectId]);

  if (loading) {
    return <div className="text-gray-500">Carregando histórico...</div>;
  }

  if (signatures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma assinatura ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Histórico de Assinaturas</h3>
      <div className="space-y-3">
        {signatures.map((signature) => (
          <div
            key={signature.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{signature.signed_by}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(signature.signed_at), 'dd/MM/yyyy HH:mm:ss', {
                    locale: ptBR,
                  })}
                </p>
                {signature.ip_address && (
                  <p className="text-xs text-gray-400">IP: {signature.ip_address}</p>
                )}
              </div>
              {signature.signature_url && (
                <a
                  href={signature.signature_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 inline-flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
