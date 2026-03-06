import React from 'react'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { logger } from '@/services/logger'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class CustomErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(error, {
      context: {
        componentStack: errorInfo.componentStack,
        area: 'ErrorBoundary',
      },
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6 text-center space-y-4 bg-background/50 border border-border/50 rounded-lg animate-in fade-in duration-500">
          <div className="p-4 bg-red-500/10 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-serif font-medium text-foreground">
              Ops! Algo deu errado.
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto font-mono">
              Não se preocupe, nosso time já foi notificado. Tente recarregar a
              página.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={this.handleRetry}
              variant="outline"
              className="gap-2 font-mono uppercase text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
