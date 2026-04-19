import React from 'react'
import { logger } from '@/services/logger'

type FallbackNode =
  | React.ReactNode
  | ((error: Error, reset: () => void) => React.ReactNode)

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: FallbackNode
  onError?: (error: Error, info: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(error, {
      message: 'ErrorBoundary caught an error.',
      context: { componentStack: errorInfo.componentStack },
      showToast: false,
    })
    this.props.onError?.(error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props
      const error = this.state.error ?? new Error('Unknown error')

      if (typeof fallback === 'function') {
        return fallback(error, this.reset)
      }
      if (fallback !== undefined) {
        return fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Algo deu errado</h2>
            <p className="text-muted-foreground mb-4">
              {error.message || 'Erro inesperado'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90"
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
