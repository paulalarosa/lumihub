import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Logger } from '@/services/logger'
import { Button } from '@/components/ui/Button'
import { FileWarning, RefreshCw, Terminal } from 'lucide-react'

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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Logger.error('Uncaught Exception in React Tree', error, 'SYSTEM', {
      componentStack: errorInfo.componentStack,
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-mono selection:bg-red-500 selection:text-white">
          <div className="max-w-xl w-full border border-red-500/50 bg-red-950/10 p-8 shadow-2xl relative overflow-hidden">
            {/* Background Noise/Scanline effect could go here */}
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20 animate-pulse" />

            <div className="flex items-center gap-4 mb-6 text-red-500">
              <FileWarning className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold tracking-widest uppercase">
                  Critical_System_Failure
                </h1>
                <p className="text-xs opacity-70">
                  ERR_CODE: UNCAUGHT_EXCEPTION
                </p>
              </div>
            </div>

            <div className="mb-8 space-y-4">
              <div className="bg-black/50 border border-red-500/20 p-4 font-mono text-xs text-red-200 overflow-auto max-h-[200px]">
                <p className="mb-2 opacity-50">{'>'} Stack Trace:</p>
                <pre className="whitespace-pre-wrap break-all">
                  {this.state.error?.toString()}
                </pre>
              </div>
              <p className="text-sm text-gray-400">
                The incident has been logged. Please attempt a system reboot via
                the interface below.
              </p>
            </div>

            <Button
              onClick={this.handleReload}
              variant="destructive"
              className="w-full rounded-none bg-red-600 hover:bg-red-700 text-white font-mono uppercase tracking-widest h-12 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reboot_System
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-600 uppercase">
              <Terminal className="w-3 h-3" />
              <span>KONTROL Secure Error Handler v2.0</span>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
