import { Loader2 } from 'lucide-react'

export function PageLoader({
  message = 'Carregando...',
}: {
  message?: string
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export function LoadingSpinner({
  className,
  size = 'default',
  style,
}: {
  className?: string
  size?: 'sm' | 'default' | 'lg'
  style?: React.CSSProperties
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <Loader2
      className={`animate-spin ${sizeClasses[size]} ${className || ''}`}
      style={style}
    />
  )
}

export { LoadingSpinner as Spinner }
export default PageLoader
