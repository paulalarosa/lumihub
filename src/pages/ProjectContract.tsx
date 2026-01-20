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
import { v4 as uuidv4 } from 'uuid';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Heading2,
  Copy,
  Download,
  FileText,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { SignatureModal } from '@/components/contracts/SignatureModal';
import { Button } from '@/components/ui/button'; // Assuming this exists, based on other files
import { cn } from '@/lib/utils'; // Assuming this exists

interface ProjectData {
  id: string;
  name: string;
  status: string;
  notes?: string | null;
}

interface ContractData extends Omit<Tables<'contracts'>, 'signature_data'> {
  signature_data: string | null;
}

export default function ProjectContract() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // State
  const [project, setProject] = useState<ProjectData | null>(null);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClientView, setIsClientView] = useState(false);

  // Signature State
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  // Download logic for finalized contract
  const [finalPdfUrl, setFinalPdfUrl] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  // Remove signatureAreaRef as we are using a modal now mostly, but might keep for the floating bar

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

          if (contractData.status === 'signed') {
            setSignedSuccess(true);
            if (contractData.signature_data) {
              try {
                const parsed = typeof contractData.signature_data === 'string'
                  ? JSON.parse(contractData.signature_data)
                  : contractData.signature_data;
                if (parsed?.pdf_url) setFinalPdfUrl(parsed.pdf_url);
              } catch (e) { console.error("Error parsing signature data", e) }
            }
          }
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
    // In a real app, you might fetch this from a service like ipify or just trust the backend log
    return 'IP Logged by Server';
  };

  // Handle contract signature from Modal
  const handleConfirmSignature = async (signatureDataUrl: string) => {
    setIsSubmitting(true);
    setIsSignatureModalOpen(false); // Close modal first

    try {
      const contractHTML = editor?.getHTML() || '';
      const signedAt = format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
      const contractHash = uuidv4().replace(/-/g, '').toUpperCase().substring(0, 16); // 16 char hash

      const signatureBlock = `
        <div style="margin-top: 60px; page-break-inside: avoid; background-color: #000; color: #fff; padding: 30px; border: 1px solid #333;">
            <div style="display: flex; justify-content: space-between; gap: 20px;">
                
                <!-- COL 1: PRESTADORA -->
                <div style="flex: 1; border-right: 1px solid #333; padding-right: 20px;">
                    <p style="font-family: 'Playfair Display', serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; color: #888;">
                        Prestadora
                    </p>
                    <div style="height: 60px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #333; margin-bottom: 10px;">
                        <span style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 18px; color: #fff;">Khaos Studio</span>
                    </div>
                    <p style="font-family: 'JetBrains Mono', monospace; font-size: 8px; text-transform: uppercase; color: #666;">
                        AUTENTICADO POR KHAOS STUDIO<br/>Paula Larosa
                    </p>
                </div>

                <!-- COL 2: CONTRATANTE -->
                <div style="flex: 1; border-right: 1px solid #333; padding-right: 20px; padding-left: 20px;">
                    <p style="font-family: 'Playfair Display', serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; color: #888;">
                        Contratante
                    </p>
                    <div style="height: 60px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #333; margin-bottom: 10px;">
                        <img src="${signatureDataUrl}" style="max-height: 50px; filter: invert(1);" />
                    </div>
                    <p style="font-family: 'JetBrains Mono', monospace; font-size: 8px; text-transform: uppercase; color: #666;">
                        ASSINATURA DIGITAL DA CLIENTE<br/>
                        IP: ${getClientIP()} | ${signedAt}
                    </p>
                </div>

                <!-- COL 3: PLATAFORMA -->
                <div style="flex: 1; padding-left: 20px; display: flex; flex-col; justify-content: flex-end; align-items: flex-start;">
                    <div style="border: 1px solid #fff; padding: 10px; width: 100%;">
                        <p style="font-family: 'JetBrains Mono', monospace; font-size: 8px; text-transform: uppercase; color: #888; margin-bottom: 5px;">
                            System ID
                        </p>
                        <p style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #fff; word-break: break-all;">
                            ${contractHash}
                        </p>
                        <p style="font-family: 'JetBrains Mono', monospace; font-size: 8px; text-transform: uppercase; color: #666; margin-top: 10px;">
                            CERTIFICADO POR<br/>KONTROL SYSTEM
                        </p>
                    </div>
                </div>

            </div>
            <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 10px; text-align: center;">
                 <p style="font-family: 'JetBrains Mono', monospace; font-size: 8px; text-transform: uppercase; color: #444; letter-spacing: 3px;">
                    SECURE DIGITAL TRANSACTION • KHAOSKONTROL.COM.BR
                </p>
            </div>
        </div>
      `;

      // Google Analytics Tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'contract_signed', {
          'event_category': 'engagement',
          'event_label': projectId
        });
      }

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
                padding: 40px;
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
        filename: `${project?.name || 'contrato'} _assinado.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
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

      // Upload PDF to Supabase Storage (briefing-files as per plan)
      // I'll also try to save the signature image if possible, but PDF is priority
      const fileName = `contracts / ${projectId}/${Date.now()}_signed.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('briefing-files')
        .upload(fileName, pdfBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Falha no upload do contrato.');
      }

      const { data: urlData } = supabase.storage
        .from('briefing-files')
        .getPublicUrl(fileName);

      // Save to Database
      const signaturePayload = {
        signed_at: new Date().toISOString(),
        ip_address: getClientIP(),
        pdf_url: urlData.publicUrl,
        contract_hash: contractHash,
        signature_base64_snippet: signatureDataUrl.substring(0, 50) + '...' // Just for debug, don't store full base64 in json to save space if needed
      };

      if (contract) {
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            content: contractHTML,
            status: 'signed',
            signature_data: JSON.stringify(signaturePayload),
            signed_at: new Date().toISOString(),
            signature_url: fileName // Storing path in signature_url or maybe just leave it
          })
          .eq('id', contract.id);

        if (updateError) throw updateError;
      } else {
        // Create new if doesn't exist (edge case)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('contracts').insert({
            project_id: projectId!,
            user_id: user.id,
            title: `Contrato - ${project?.name}`,
            content: contractHTML,
            status: 'signed',
            signature_data: JSON.stringify(signaturePayload),
            signed_at: new Date().toISOString(),
          });
        }
      }

      // Success
      setFinalPdfUrl(urlData.publicUrl);
      setSignedSuccess(true);
      if (project) {
        setProject({ ...project, status: 'signed' });
      }

      toast({
        title: 'CONTRATO SELADO',
        description: 'Sua cópia assinada já está disponível.',
        className: "bg-black text-white border-neutral-800 font-mono"
      });

    } catch (error) {
      console.error('Erro ao assinar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar o contrato. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download current PDF from Editor (Draft) or Signed URL
  const handleDownloadPDF = async () => {
    if (finalPdfUrl) {
      window.open(finalPdfUrl, '_blank');
      return;
    }

    if (!editor) return;

    try {
      const html = editor.getHTML();
      const opt = {
        margin: 10,
        filename: `${project?.name || 'contrato'}_draft.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };

      html2pdf().set(opt).from(html).save();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Carregando Contrato...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-white mb-4">Contrato Indisponível</h1>
          <p className="text-neutral-500 font-mono text-sm">Este contrato não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-8 px-4 flex flex-col items-center">
      {/* Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onConfirm={handleConfirmSignature}
        isLoading={isSubmitting}
      />

      <div className="max-w-[210mm] w-full mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-serif text-black mb-1">{project.name}</h1>
            <p className="text-neutral-500 text-xs uppercase tracking-widest font-mono">
              {signedSuccess ? 'Documento Autenticado' : 'Revisão de Minuta'}
            </p>
          </div>

          {/* Actions Toolbar */}
          {!isClientView && !signedSuccess && editor && (
            <div className="bg-white rounded-none border border-neutral-300 p-2 flex gap-2 items-center shadow-sm">
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} className={cn("h-8 w-8", editor.isActive('bold') && 'bg-neutral-100')}><Bold className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("h-8 w-8", editor.isActive('italic') && 'bg-neutral-100')}><Italic className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} className={cn("h-8 w-8", editor.isActive('underline') && 'bg-neutral-100')}><UnderlineIcon className="w-4 h-4" /></Button>
              <div className="w-[1px] h-4 bg-neutral-300 mx-1" />
              <Button variant="ghost" size="icon" onClick={handleGenerateSignatureLink} title="Copiar Link"><Copy className="w-4 h-4" /></Button>
            </div>
          )}
        </div>

        {/* Editor / Paper */}
        <div
          ref={editorRef}
          className="bg-white shadow-2xl p-[20mm] min-h-[297mm] text-black mb-24 relative"
          style={{ fontFamily: "'Times New Roman', serif", lineHeight: '1.6' }}
        >
          {/* Watermark/Stamp if signed */}
          {signedSuccess && (
            <div className="absolute top-10 right-10 opacity-80 pointer-events-none border-4 border-[#000] p-4 rotate-[-5deg]">
              <div className="text-center">
                <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-black" />
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-black">ASSINADO DIGITALMENTE</p>
                <p className="font-mono text-[10px] uppercase text-black">Kontrol Trust System</p>
              </div>
            </div>
          )}

          <EditorContent
            editor={editor}
            className={`prose max-w-none ${isClientView || signedSuccess ? 'prose-disabled pointer-events-none' : ''}`}
          />
        </div>

        {/* Client Floating Action Bar */}
        {(isClientView || signedSuccess) && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-neutral-200 p-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">

              {signedSuccess ? (
                <div className="flex items-center gap-4 w-full justify-between">
                  <div className="flex items-center gap-3 text-green-700">
                    <FileCheck className="w-6 h-6" />
                    <div>
                      <p className="font-serif italic text-lg">Contrato Selado</p>
                      <p className="text-[10px] uppercase tracking-widest font-mono text-neutral-500">Bem-vinda ao universo KONTROL</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadPDF}
                    className="bg-black text-white hover:bg-neutral-800 rounded-none h-12 px-8 uppercase tracking-widest text-xs font-bold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar via Original (PDF)
                  </Button>
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <p className="font-serif italic text-black">Aprovação Formal</p>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500">Leia atentamente antes de assinar</p>
                  </div>
                  <Button
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="w-full md:w-auto bg-black text-white hover:bg-neutral-800 rounded-none h-12 px-10 uppercase tracking-widest text-xs font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Assinar Contrato
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
