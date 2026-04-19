import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import React from 'react'

interface ActionButtonProps extends ButtonProps {
  loading?: boolean
  fullWidth?: boolean
}

export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  ActionButtonProps
>(({ className, loading, children, fullWidth, disabled, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'bg-white text-black hover:bg-white/90',
        'rounded-none uppercase tracking-wider text-xs font-bold',
        'transition-all duration-200',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
})
ActionButton.displayName = 'ActionButton'

export const OutlineButton = React.forwardRef<
  HTMLButtonElement,
  ActionButtonProps
>(({ className, loading, children, fullWidth, disabled, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      disabled={disabled || loading}
      className={cn(
        'bg-transparent border-white/20 text-white',
        'hover:bg-white hover:text-black hover:border-white',
        'rounded-none uppercase tracking-wider text-xs font-mono',
        'transition-all duration-200',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
})
OutlineButton.displayName = 'OutlineButton'
