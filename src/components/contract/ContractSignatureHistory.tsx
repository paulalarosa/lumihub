import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, FileText } from 'lucide-react';

interface ContractSignatureData {
  id: string;
  project_id: string;
  signed_by?: string | null;
  signed_at: string | null;
  signature_data: string | null;
  status: string;
  created_at: string;
}

export function ContractSignatureHistory({ projectId }: { projectId: string }) {
  const [signatures, setSignatures] = useState<ContractSignatureData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignatures = async () => {
      try {
        // Note: This table may not exist yet - will need to be created via migration
        // For now, we'll handle the error gracefully
        const { data, error } = await supabase
          .from('contracts')
          .select('id, project_id, status, signed_at, signature_data, created_at')
          .eq('project_id', projectId)
          .eq('status', 'signed')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSignatures(data || []);
      } catch (error) {
        console.error('Erro ao buscar assinaturas:', error);
        setSignatures([]);
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
                <p className="font-medium text-gray-900">
                  {signature.signed_by || 'Contrato Assinado'}
                </p>
                {signature.signed_at && (
                  <p className="text-sm text-gray-500">
                    {format(new Date(signature.signed_at), 'dd/MM/yyyy HH:mm:ss', {
                      locale: ptBR,
                    })}
                  </p>
                )}
              </div>
              {signature.signature_data && (
                <div className="ml-4 inline-flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded">
                  <Download className="w-4 h-4" />
                  Assinado
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
