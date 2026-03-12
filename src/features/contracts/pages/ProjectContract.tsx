import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Copy,
  Download,
  FileText,
  FileCheck,
  ShieldCheck,
} from 'lucide-react'
import { SignatureModal } from '@/features/contracts/components/SignatureModal'
import SEOHead from '@/components/seo/SEOHead'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
// format and ptBR removed (handled by formatDate)
import { useProjectContract } from '@/hooks/useProjectContract'

export default function ProjectContract() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const [isClientView, setIsClientView] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    editable: true,
    onUpdate: ({ editor }) => {
      if (projectId && !isClientView) {
        localStorage.setItem(`contract_${projectId}`, editor.getHTML())
      }
    },
  })

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'client') {
      setIsClientView(true)
      if (editor) editor.setEditable(false)
    }
  }, [searchParams, editor])

  const ctr = useProjectContract({ projectId, isClientView, editor })

  if (ctr.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Carregando Contrato...
          </p>
        </div>
      </div>
    )
  }

  if (!ctr.project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-white mb-4">
            Contrato Indisponível
          </h1>
          <p className="text-neutral-500 font-mono text-sm">
            Este contrato não existe ou foi removido.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-8 px-4 flex flex-col items-center">
      <SignatureModal
        isOpen={ctr.isSignatureModalOpen}
        onClose={() => ctr.setIsSignatureModalOpen(false)}
        onConfirm={ctr.handleConfirmSignature}
        isLoading={ctr.isSubmitting}
      />

      <div className="max-w-[210mm] w-full mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-serif text-black mb-1">
              {ctr.project.name}
            </h1>
            <p className="text-neutral-500 text-xs uppercase tracking-widest font-mono">
              {ctr.signedSuccess
                ? 'Documento Autenticado'
                : 'Revisão de Minuta'}
            </p>
          </div>

          {!isClientView && !ctr.signedSuccess && editor && (
            <div className="bg-white rounded-none border border-neutral-300 p-2 flex gap-2 items-center shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  'h-8 w-8',
                  editor.isActive('bold') && 'bg-neutral-100',
                )}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  'h-8 w-8',
                  editor.isActive('italic') && 'bg-neutral-100',
                )}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn(
                  'h-8 w-8',
                  editor.isActive('underline') && 'bg-neutral-100',
                )}
              >
                <UnderlineIcon className="w-4 h-4" />
              </Button>
              <div className="w-[1px] h-4 bg-neutral-300 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={ctr.handleGenerateSignatureLink}
                title="Copiar Link"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div
          ref={editorRef}
          className="bg-white shadow-2xl p-[20mm] min-h-[297mm] text-black mb-24 relative"
          style={{ fontFamily: "'Times New Roman', serif", lineHeight: '1.6' }}
        >
          {ctr.signedSuccess && (
            <div className="absolute top-10 right-10 opacity-80 pointer-events-none border-4 border-[#000] p-4 rotate-[-5deg]">
              <div className="text-center">
                <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-black" />
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-black">
                  ASSINADO DIGITALMENTE
                </p>
                <p className="font-mono text-[10px] uppercase text-black">
                  Kontrol Trust System
                </p>
              </div>
            </div>
          )}
          <EditorContent
            editor={editor}
            className={`prose max-w-none ${isClientView || ctr.signedSuccess ? 'prose-disabled pointer-events-none' : ''}`}
          />
        </div>

        {(isClientView || ctr.signedSuccess) && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-neutral-200 p-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              {ctr.signedSuccess ? (
                <div className="flex items-center gap-4 w-full justify-between">
                  <div className="flex items-center gap-3 text-green-700">
                    <FileCheck className="w-6 h-6" />
                    <div>
                      <p className="font-serif italic text-lg">
                        Contrato Selado
                      </p>
                      <p className="text-[10px] uppercase tracking-widest font-mono text-neutral-500">
                        Bem-vinda ao universo KONTROL
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={ctr.handleDownloadPDF}
                    className="bg-black text-white hover:bg-neutral-800 rounded-none h-12 px-8 uppercase tracking-widest text-xs font-bold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar via Original (PDF)
                  </Button>
                </div>
              ) : (
                <>
                  <SEOHead
                    title="Assinatura de Contrato | KHAOS KONTROL"
                    description="Assine seu contrato de prestação de serviços de forma digital e segura."
                  />
                  <div className="hidden md:block">
                    <p className="font-serif italic text-black">
                      Aprovação Formal
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                      Leia atentamente antes de assinar
                    </p>
                  </div>
                  <Button
                    onClick={() => ctr.setIsSignatureModalOpen(true)}
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
  )
}
