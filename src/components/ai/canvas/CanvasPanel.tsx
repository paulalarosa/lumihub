import { useState, useEffect } from 'react'
import { useCanvasActions } from '@/features/ai/hooks/useCanvasActions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  X,
  Copy,
  Save,
  FileText,
  Code,
  FileCode,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { SafeHTML } from '@/components/ui/SafeHTML'
export const CanvasPanel = () => {
  const {
    activeCanvas,
    activeCanvasId,
    isCanvasOpen,
    isSaving,
    updateCanvas,
    setActiveCanvas,
  } = useCanvasActions()

  const [content, setContent] = useState(activeCanvas?.content || '')
  const [title, setTitle] = useState(activeCanvas?.title || 'Novo Documento')
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview')

  useEffect(() => {
    if (activeCanvas) {
      setContent(activeCanvas.content)
      setTitle(activeCanvas.title)
    }
  }, [activeCanvas])

  const handleSave = async () => {
    if (!activeCanvasId || !activeCanvas) return
    updateCanvas(activeCanvasId, { content, title })
  }

  const _handleDownload = () => {
    if (!activeCanvas) return

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Download iniciado!')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    toast.success('Copiado para a área de transferência!')
  }

  const handleAIRefine = async () => {
    toast.info('Enviando para a IA refinar... (Protocolo em desenvolvimento)')
  }

  if (!isCanvasOpen || !activeCanvas) return null

  return (
    <div
      className={cn(
        'fixed top-0 right-0 h-screen w-full md:w-[600px] bg-zinc-950 border-l border-white/10 shadow-2xl z-[60] flex flex-col transition-transform duration-500',
        activeCanvasId ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      {}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 bg-white/5 border border-white/10 flex items-center justify-center rounded-none rotate-45">
            <div className="-rotate-45">
              {activeCanvas.type === 'contract' ? (
                <FileText className="w-4 h-4 text-purple-400" />
              ) : activeCanvas.type === 'html' ? (
                <Code className="w-4 h-4 text-blue-400" />
              ) : (
                <FileCode className="w-4 h-4 text-emerald-400" />
              )}
            </div>
          </div>

          <div className="flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="bg-transparent border-none text-white font-mono text-xs uppercase tracking-widest focus-visible:ring-0 p-0 h-auto"
            />
            <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
              Active Artifact Stream
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveCanvas(null)}
          className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {}
      <div className="flex items-center flex-wrap gap-2 p-3 border-b border-white/5 bg-zinc-900/30">
        <div className="flex gap-1 bg-black p-1 border border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('edit')}
            className={cn(
              'text-[10px] font-mono uppercase tracking-[0.2em] rounded-none h-7 px-3',
              viewMode === 'edit'
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'text-zinc-500 hover:text-white',
            )}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('preview')}
            className={cn(
              'text-[10px] font-mono uppercase tracking-[0.2em] rounded-none h-7 px-3',
              viewMode === 'preview'
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'text-zinc-500 hover:text-white',
            )}
          >
            Preview
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAIRefine}
            className="text-[9px] font-mono uppercase tracking-widest h-7 text-zinc-400 hover:text-white"
          >
            <Sparkles className="w-3 h-3 mr-2" />
            Refine
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-[9px] font-mono uppercase tracking-widest h-7 text-zinc-400 hover:text-white"
          >
            <Copy className="w-3 h-3 mr-2" />
            Copy
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-white text-black hover:bg-zinc-200 text-[9px] font-mono uppercase tracking-[0.2em] h-7 px-4 rounded-none ml-2"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <Save className="w-3 h-3 mr-2" />
            )}
            Commit
          </Button>
        </div>
      </div>

      {}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {viewMode === 'edit' ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full resize-none bg-black border-none text-zinc-300 font-mono text-xs p-8 focus-visible:ring-0 selection:bg-white selection:text-black leading-relaxed"
            placeholder="Initialize artifact stream contents..."
          />
        ) : (
          <div className="h-full overflow-y-auto p-8 bg-zinc-50 modern-scroll">
            <div className="max-w-3xl mx-auto prose prose-zinc prose-sm">
              {activeCanvas.type === 'html' ? (
                <SafeHTML html={content} />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        )}
      </div>

      {}
      <div className="p-3 border-t border-white/5 bg-black text-[8px] font-mono uppercase tracking-[0.3em] font-bold text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-emerald-500/50 flex items-center gap-2">
            <div className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse" />
            Stream_Synced
          </span>
          <span>{content.length} bytes</span>
          <span>{content.split('\n').length} lines</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Last_Sync:</span>
          <span className="text-white">
            {new Date(activeCanvas.updatedAt).toLocaleTimeString('pt-BR', {
              hour12: false,
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
