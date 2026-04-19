import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Bold,
  Italic,
  List,
  Heading2,
  Undo,
  Redo,
  Sparkles,
  Bot,
  Gavel,
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  Loader2,
  ScanSearch,
  X,
} from 'lucide-react'
import { useEffect } from 'react'
import { useSmartContractEditor } from './hooks/useSmartContractEditor'

interface SmartContractEditorProps {
  content: string
  onChange: (content: string) => void
  projectId: string | null
}

export function SmartContractEditor({
  content,
  onChange,
  projectId,
}: SmartContractEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4 text-sm leading-relaxed text-white/90',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  })

  const h = useSmartContractEditor(projectId, editor)

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (editor.getText().length === 0 && content.length > 0) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[600px]">
      <div className="flex-1 flex flex-col border border-white/10 rounded-none bg-black overflow-hidden relative">
        <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-black">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rounded-none h-8 w-8 ${editor.isActive('bold') ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rounded-none h-8 w-8 ${editor.isActive('italic') ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`rounded-none h-8 w-8 ${editor.isActive('heading', { level: 2 }) ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`rounded-none h-8 w-8 ${editor.isActive('bulletList') ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
          >
            <List className="w-4 h-4" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            className="rounded-none h-8 w-8 text-white hover:bg-white/10"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            className="rounded-none h-8 w-8 text-white hover:bg-white/10"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <EditorContent editor={editor} className="h-full min-h-[500px]" />
        </ScrollArea>

        <div className="px-4 py-3 bg-black border-t border-white/10 flex justify-between items-center">
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
            {editor.storage.characterCount?.characters()} CARACTERES
          </span>
          <div className="flex items-center gap-3">
            <div
              className={`w-1.5 h-1.5 rounded-none rotate-45 ${h.projectData ? 'bg-white' : 'bg-white/20'}`}
            />
            <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
              {h.projectData ? 'KHAOS SYNC ATIVO' : 'AGUARDANDO PROJETO'}
            </span>
          </div>
        </div>
      </div>

      {h.reviewResult && (
        <div className="w-full md:w-80 flex flex-col border border-white/10 bg-black overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ScanSearch className="w-3.5 h-3.5 text-white/60" />
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/70">
                Parecer jurídico
              </h3>
            </div>
            <button
              onClick={h.closeReview}
              className="text-white/40 hover:text-white transition-colors"
              aria-label="Fechar parecer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div
              className="text-[12px] text-white/75 leading-relaxed [&_h2]:text-white [&_h2]:font-mono [&_h2]:text-[10px] [&_h2]:uppercase [&_h2]:tracking-widest [&_h2]:mt-0 [&_h2]:mb-3 [&_h3]:text-white [&_h3]:font-mono [&_h3]:text-[11px] [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_li]:text-white/70 [&_p]:mt-2"
              dangerouslySetInnerHTML={{ __html: h.reviewResult }}
            />
          </ScrollArea>
        </div>
      )}

      <div className="w-full md:w-72 flex flex-col gap-6">
        <div className="p-0 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs text-white/50 uppercase tracking-widest">
              Khaos Intelligence
            </h3>
            <Bot className="w-4 h-4 text-white/60" />
          </div>
          <Button
            className="w-full bg-black hover:bg-white hover:text-black border border-white text-white rounded-none h-12 transition-all duration-300 font-mono text-xs uppercase tracking-widest group"
            onClick={h.handleGenerateTemplate}
            disabled={!projectId || h.isAiGenerating}
          >
            {h.isAiGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2 text-white/60 group-hover:text-black" />
            )}
            {h.isAiGenerating ? 'PROCESSANDO...' : 'GERAR COM IA'}
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-none h-10 font-mono text-[10px] uppercase tracking-widest border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={h.handleReview}
            disabled={h.isReviewing}
          >
            {h.isReviewing ? (
              <Loader2 className="w-3 h-3 animate-spin mr-2" />
            ) : (
              <ScanSearch className="w-3 h-3 mr-2" />
            )}
            {h.isReviewing ? 'REVISANDO...' : 'REVISAR CONTRATO'}
          </Button>
          <p className="text-[10px] text-white/30 font-mono leading-relaxed border-l border-white/10 pl-3">
            Gerar aplica minuta jurídica completa. Revisar retorna parecer
            sobre riscos e lacunas.
          </p>
        </div>

        <Separator className="bg-white/10" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs text-white/50 uppercase tracking-widest">
              Refinar / Editar
            </h3>
            <MessageCircle className="w-3 h-3 text-white/50" />
          </div>
          <div className="flex gap-2">
            <Input
              value={h.aiCommand}
              onChange={(e) => h.setAiCommand(e.target.value)}
              placeholder="Ex: Altere a multa para 20%..."
              className="bg-black border-white/20 rounded-none text-white font-mono text-[10px] h-9 focus:border-white placeholder:text-white/20"
              onKeyDown={(e) => e.key === 'Enter' && h.handleRefine()}
            />
            <Button
              onClick={h.handleRefine}
              disabled={h.isRefining || !h.aiCommand}
              variant="secondary"
              className="rounded-none h-9 px-3 bg-white text-black hover:bg-gray-200"
            >
              {h.isRefining ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 text-black" />
              )}
            </Button>
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="w-4 h-4 text-white" />
            <h3 className="font-mono text-xs text-white uppercase tracking-widest">
              CLÁUSULAS RÁPIDAS
            </h3>
          </div>
          <ScrollArea className="flex-1 pr-2 -mr-2">
            <div className="space-y-3">
              <ClauseButton
                title="TAXA DE DESLOCAMENTO"
                icon={<AlertTriangle className="w-3 h-3" />}
                onClick={() =>
                  h.insertClause(
                    'TAXA DE DESLOCAMENTO',
                    'Fica estabelecido que despesas de deslocamento e hospedagem (se necessário) correrão por conta exclusiva da CONTRATANTE.',
                  )
                }
              />
              <ClauseButton
                title="MAQUIAGEM ADICIONAL"
                icon={<Sparkles className="w-3 h-3" />}
                onClick={() =>
                  h.insertClause(
                    'MAQUIAGEM ADICIONAL',
                    'Serviços adicionais solicitados no dia do evento estarão sujeitos à disponibilidade de tempo e serão cobrados conforme tabela vigente.',
                  )
                }
              />
              <ClauseButton
                title="FORÇA MAIOR"
                icon={<ShieldIcon className="w-3 h-3" />}
                onClick={() =>
                  h.insertClause(
                    'FORÇA MAIOR',
                    'Em caso de impedimento por saúde da CONTRATADA, esta compromete-se a indicar profissional de mesma competência para a execução do serviço.',
                  )
                }
              />
              <ClauseButton
                title="DIREITO DE IMAGEM"
                icon={<CheckCircle2 className="w-3 h-3" />}
                onClick={() =>
                  h.insertClause(
                    'DIREITO DE IMAGEM',
                    'A CONTRATANTE autoriza o uso de sua imagem para fins de divulgação do portfólio da CONTRATADA, em redes sociais e site oficial.',
                  )
                }
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

function ClauseButton({
  title,
  icon,
  onClick,
}: {
  title: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 text-left bg-black border border-white/20 hover:bg-white hover:text-black transition-all group rounded-none"
    >
      <div className="text-white group-hover:text-black transition-colors">
        {icon}
      </div>
      <span className="font-mono text-[10px] text-white group-hover:text-black uppercase tracking-wider transition-colors">
        {title}
      </span>
    </button>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}
