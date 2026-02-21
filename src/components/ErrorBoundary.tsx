import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { logger } from '@/services/logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(error, {
      message: 'Erro crítico não capturado.',
      context: { componentStack: errorInfo.componentStack },
      showToast: false,
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono">
          <div className="max-w-md w-full border border-red-500/20 bg-zinc-950 p-8 space-y-6">
            <div className="flex items-center gap-4 border-b border-red-500/10 pb-6">
              <div className="h-12 w-12 bg-red-500/10 flex items-center justify-center rounded-none rotate-45 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-500 -rotate-45" />
              </div>
              <div>
                <h1 className="text-[12px] font-black tracking-[0.3em] text-white uppercase">
                  Critical_System_Fault
                </h1>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
                  Protocol: SHUTDOWN_PREVENTED
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] text-zinc-400 uppercase tracking-widest leading-relaxed">
                A critical exception occurred within the neural execution core.
                Data integrity has been preserved. Manual restart required.
              </p>

              {import.meta.env.DEV && (
                <div className="bg-black/50 border border-white/5 p-4 overflow-auto max-h-40">
                  <p className="text-[9px] text-red-400/70 font-mono break-all italic">
                    {this.state.error?.toString()}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="rounded-none border-white/10 hover:bg-white/5 text-[10px] uppercase tracking-widest font-bold h-11"
              >
                <Home className="w-4 h-4 mr-2" />
                Origin
              </Button>
              <Button
                onClick={this.handleReload}
                className="bg-white text-black hover:bg-zinc-200 rounded-none text-[10px] uppercase tracking-widest font-bold h-11"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Initialize
              </Button>
            </div>

            <div className="flex items-center justify-between opacity-30 pt-4 border-t border-white/5">
              <span className="text-[7px] text-white uppercase tracking-[0.4em]">
                Error_Code: 0x882A_NULL
              </span>
              <span className="text-[7px] text-zinc-600 uppercase tracking-widest">
                Khaos Kontrol Enterprise
              </span>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
