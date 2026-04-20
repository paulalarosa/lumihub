import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageErrorFallbackProps {
  error?: Error | null
  onRetry?: () => void
}

export function PageErrorFallback({ error, onRetry }: PageErrorFallbackProps) {
  const isDev = import.meta.env.DEV

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-white/10 bg-white/[0.02] p-10 text-center space-y-6">
        <AlertTriangle className="w-8 h-8 text-white/30 mx-auto" />

        <div className="space-y-2">
          <p className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
            Erro inesperado
          </p>
          <p className="font-serif text-2xl text-white">
            Algo quebrou nesta página
          </p>
          <p className="text-white/40 text-sm leading-relaxed">
            O resto do sistema continua funcionando. Tente recarregar a página
            ou navegar para outra seção.
          </p>
        </div>

        {isDev && error?.message && (
          <div className="text-left border border-red-500/20 bg-red-950/10 p-4">
            <p className="font-mono text-[9px] text-red-500/70 tracking-widest uppercase mb-2">
              Debug
            </p>
            <p className="font-mono text-xs text-red-400 break-all">
              {error.message}
            </p>
          </div>
        )}

        <Button
          variant="primary"
          onClick={onRetry ?? (() => window.location.reload())}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Recarregar página
        </Button>
      </div>
    </div>
  )
}
