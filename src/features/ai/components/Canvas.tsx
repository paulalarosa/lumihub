import React, { memo } from 'react'
import {
  X,
  Maximize2,
  Minimize2,
  Download,
  Copy,
  FileText,
  Code,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/markdown-renderer'

interface CanvasProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  type?: 'document' | 'code' | 'chart'
  language?: string
}

export const Canvas = memo(function Canvas({
  isOpen,
  onClose,
  title,
  content,
  type = 'document',
  language,
}: CanvasProps) {
  const [isMaximized, setIsMaximized] = React.useState(false)

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 z-50 bg-black border-l border-white/10 flex flex-col transition-all duration-500 ease-in-out shadow-2xl',
        isMaximized ? 'left-0' : 'w-full md:w-[600px] lg:w-[800px]',
      )}
    >
      {/* Canvas Header */}
      <div className="h-14 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-white/5 border border-white/10 flex items-center justify-center rounded-none">
            {type === 'code' ? (
              <Code className="h-4 w-4 text-blue-400" />
            ) : (
              <FileText className="h-4 w-4 text-emerald-400" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              {title || 'PROCESSED_ARTIFACT'}
            </h3>
            <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-tighter">
              {type} // {language || 'standard'} // SHA-256 VALIDATED
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-white rounded-none"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-white rounded-none"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black">
        <div className="max-w-3xl mx-auto">
          <MarkdownRenderer content={content} />
        </div>
      </div>

      {/* Canvas Footer */}
      <div className="h-12 border-t border-white/5 bg-zinc-950/50 px-4 flex items-center justify-between">
        <div className="flex gap-4">
          <button className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
            <Copy className="h-3 w-3" /> Copy_RAW
          </button>
          <button className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
            <Download className="h-3 w-3" /> Export_FILESYSTEM
          </button>
        </div>
        <div className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest">
          KHAOS_PROTOCOL_CANVAS_v1.0
        </div>
      </div>
    </div>
  )
})
