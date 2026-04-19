import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center bg-white/[0.02] border border-white/10',
        className,
      )}
    >
      <div className="w-14 h-14 bg-white/[0.04] flex items-center justify-center mb-5 border border-white/10">
        <Icon className="h-7 w-7 text-white/30" />
      </div>
      <h3 className="font-serif text-xl text-white mb-2 uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-white/40 mb-8 max-w-sm mx-auto leading-relaxed font-mono text-xs">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-white text-black hover:bg-white/90 h-10 px-8 rounded-none font-mono text-xs uppercase tracking-widest"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
