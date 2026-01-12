import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2pdf from 'html2pdf.js';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Heading2,
  Copy,
  Download,
  FileText,
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

interface ProjectData {
  id: string;
  name: string;
  status: string;
  notes?: string | null;
}

interface ContractData extends Tables<'contracts'> {}

export default function ProjectContract() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<ProjectData | null>(null);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClientView, setIsClientView] = useState(false);
  const [signingData, setSigningData] = useState({
    name: '',
    agreed: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const signatureAreaRef = useRef<HTMLDivElement>(null);

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    editable: true,
    onUpdate: ({ editor }) => {
      if (projectId && !isClientView) {
        localStorage.setItem(`contract_${projectId}`, editor.getHTML());
      }
    },
  });

  // Detect client mode from URL
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'client') {
      setIsClientView(true);
      if (editor) {
        editor.setEditable(false);
      }
    }
  }, [searchParams, editor]);

  // Fetch project and contract content
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, name, status, notes')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);

        // Fetch contract from contracts table
        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        if (contractError && contractError.code !== 'PGRST116') {
          console.error('Error fetching contract:', contractError);
        }

        if (contractData) {
          setContract(contractData);
        }

        // Load contract content into editor
        const savedContent = localStorage.getItem(`contract_${projectId}`);
        const contentToLoad = savedContent || contractData?.content || '';

        if (editor && contentToLoad) {
          editor.commands.setContent(contentToLoad);
        }
      } catch (error) {
        console.error('Erro ao buscar projeto:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o contrato.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, editor, toast]);

  // Generate signature link
  const handleGenerateSignatureLink = async () => {
    if (!projectId) return;

    const signatureUrl = `${window.location.origin}/projects/${projectId}/contract?mode=client`;

    try {
      await navigator.clipboard.writeText(signatureUrl);
      toast({
        title: 'Sucesso!',
        description: 'Link de assinatura copiado para a área de transferência.',
      });
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

  // Get client IP (simulated)
  const getClientIP = () => {
    return '127.0.0.1';
  };

  // Handle contract signature
  const handleSignContract = async () => {
    if (!signingData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha seu nome completo.',
        variant: 'destructive',
      });
      return;
    }

    if (!signingData.agreed) {
      toast({
        title: 'Erro',
        description: 'Por favor, concorde com os termos do contrato.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const contractHTML = editor?.getHTML() || '';
      const signedAt = format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
      const signatureBlock = `
        <div style="margin-top: 60px; border-top: 1px solid #000; padding-top: 20px; font-family: 'Times New Roman', serif; text-align: center;">
          <p style="margin: 10px 0; font-size: 14px;">
            <strong>Assinado digitalmente por:</strong> ${signingData.name}
          </p>
          <p style="margin: 10px 0; font-size: 14px;">
            <strong>Data:</strong> ${signedAt}
          </p>
          <p style="margin: 10px 0; font-size: 14px;">
            <strong>IP:</strong> ${getClientIP()}
          </p>
        </div>
      `;

      const fullHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: 'Times New Roman', serif;
                line-height: 1.6;
                color: #000;
              }
              p { margin: 10px 0; }
              h1 { font-size: 24px; margin: 20px 0; }
              h2 { font-size: 18px; margin: 15px 0; }
              ul, ol { margin: 10px 0 10px 20px; }
              li { margin: 5px 0; }
            </style>
          </head>
          <body>
            ${contractHTML}
            ${signatureBlock}
          </body>
        </html>
      `;

      const opt = {
        margin: 10,
        filename: `${project?.name || 'contrato'}_assinado.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };

      // Generate PDF blob
      const pdfBlob = await new Promise<Blob>((resolve, reject) => {
        html2pdf()
          .set(opt as any)
          .from(fullHTML)
          .toPdf()
          .output('blob')
          .then((blob: Blob) => resolve(blob))
          .catch((err: Error) => reject(err));
      });

      // Upload PDF to Supabase Storage
      const fileName = `contracts/${projectId}/${Date.now()}_${signingData.name.replace(/\s+/g, '_')}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('briefing-files')
        .upload(fileName, pdfBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Continue even if upload fails
      }

      const { data: urlData } = supabase.storage
        .from('briefing-files')
        .getPublicUrl(fileName);

      // Update or create contract in contracts table
      if (contract) {
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            content: contractHTML,
            status: 'signed',
            signature_data: JSON.stringify({
              signed_by: signingData.name,
              signed_at: new Date().toISOString(),
              ip_address: getClientIP(),
              pdf_url: urlData.publicUrl,
            }),
            signed_at: new Date().toISOString(),
          })
          .eq('id', contract.id);

        if (updateError) throw updateError;
      } else {
        // Get current user for contract creation
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { error: insertError } = await supabase
            .from('contracts')
            .insert({
              project_id: projectId!,
              user_id: user.id,
              title: `Contrato - ${project?.name}`,
              content: contractHTML,
              status: 'signed',
              signature_data: JSON.stringify({
                signed_by: signingData.name,
                signed_at: new Date().toISOString(),
                ip_address: getClientIP(),
                pdf_url: urlData.publicUrl,
              }),
              signed_at: new Date().toISOString(),
            });

          if (insertError) throw insertError;
        }
      }

      toast({
        title: 'Sucesso!',
        description: 'Contrato assinado e PDF gerado com sucesso.',
      });

      setSigningData({ name: '', agreed: false });

      if (project) {
        setProject({ ...project, status: 'signed' });
      }
    } catch (error) {
      console.error('Erro ao assinar contrato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar ou salvar o PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download current PDF
  const handleDownloadPDF = async () => {
    if (!editor) return;

    try {
      const html = editor.getHTML();
      const opt = {
        margin: 10,
        filename: `${project?.name || 'contrato'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };

      html2pdf().set(opt).from(html).save();

      toast({
        title: 'Sucesso!',
        description: 'PDF gerado e baixado.',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PDF.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin">
          <FileText className="w-8 h-8 text-gray-600" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Projeto não encontrado</h1>
          <p className="text-gray-600">O contrato solicitado não existe.</p>
        </div>
      </div>
    );
  }

  const isSigned = contract?.status === 'signed' || project.status === 'signed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
          <p className="text-gray-600">Contrato do Projeto</p>
        </div>

        {/* Toolbar */}
        {!isClientView && editor && (
          <div className="bg-white rounded-t-lg border border-b-0 border-gray-200 p-4 flex flex-wrap gap-2 items-center shadow-sm">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-100 transition ${
                editor.isActive('bold') ? 'bg-gray-200' : ''
              }`}
              title="Negrito"
            >
              <Bold className="w-5 h-5" />
            </button>

            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-100 transition ${
                editor.isActive('italic') ? 'bg-gray-200' : ''
              }`}
              title="Itálico"
            >
              <Italic className="w-5 h-5" />
            </button>

            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded hover:bg-gray-100 transition ${
                editor.isActive('underline') ? 'bg-gray-200' : ''
              }`}
              title="Sublinhado"
            >
              <UnderlineIcon className="w-5 h-5" />
            </button>

            <div className="h-6 border-l border-gray-300"></div>

            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded hover:bg-gray-100 transition ${
                editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
              }`}
              title="Título"
            >
              <Heading2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-100 transition ${
                editor.isActive('bulletList') ? 'bg-gray-200' : ''
              }`}
              title="Lista"
            >
              <List className="w-5 h-5" />
            </button>

            <div className="h-6 border-l border-gray-300 ml-auto mr-2"></div>

            <button
              onClick={handleGenerateSignatureLink}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              title="Gerar Link de Assinatura"
            >
              <Copy className="w-4 h-4" />
              Gerar Link
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              title="Baixar PDF"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        )}

        {/* Editor Container */}
        <div
          ref={editorRef}
          className={`bg-white border border-gray-200 ${!isClientView ? 'rounded-b-lg' : 'rounded-lg'} shadow-lg p-8 min-h-96`}
          style={{
            maxWidth: '210mm',
            minHeight: '297mm',
            fontFamily: "'Times New Roman', serif",
            lineHeight: '1.6',
          }}
        >
          <EditorContent
            editor={editor}
            className={`prose max-w-none ${isClientView ? 'prose-disabled' : ''}`}
            style={{
              color: '#000',
            }}
          />
        </div>

        {/* Client View - Signature Area */}
        {isClientView && (
          <div
            ref={signatureAreaRef}
            className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg z-50"
            style={{
              maxWidth: '100%',
            }}
          >
            <div className="max-w-4xl mx-auto px-4 py-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Assinar Contrato</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={signingData.agreed}
                    onChange={(e) =>
                      setSigningData({ ...signingData, agreed: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                  />
                  <label
                    htmlFor="agree"
                    className="text-sm text-gray-700 cursor-pointer font-medium"
                  >
                    Li e concordo com os termos
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="Nome completo para assinatura"
                  value={signingData.name}
                  onChange={(e) =>
                    setSigningData({ ...signingData, name: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />

                <button
                  onClick={handleSignContract}
                  disabled={isSubmitting || !signingData.agreed}
                  className="w-full px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Assinando...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Assinar Contrato
                    </>
                  )}
                </button>
              </div>

              {isSigned && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Contrato já foi assinado
                </div>
              )}
            </div>
          </div>
        )}

        {isClientView && <div className="h-32"></div>}
      </div>
    </div>
  );
}
