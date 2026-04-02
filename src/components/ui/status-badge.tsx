import { Badge, BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import React from 'react'

interface StatusBadgeProps extends BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  label: React.ReactNode
}

const colorStyles = {
  default: 'border-white/20 text-white/60',
  success: 'border-green-500/50 text-green-500 bg-green-500/10',
  warning: 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10',
  danger: 'border-red-500/50 text-red-500 bg-red-500/10',
  info: 'border-blue-500/50 text-blue-500 bg-blue-500/10',
  neutral: 'border-white/20 text-white/40',
}

export const StatusBadge = ({
  className,
  variant = 'outline',
  color = 'default',
  label,
  ...props
}: StatusBadgeProps) => {
  return (
    <Badge
      variant={variant}
      className={cn(
        'rounded-none font-mono text-[10px] uppercase tracking-widest px-2 py-0.5',
        colorStyles[color],
        className,
      )}
      {...props}
    >
      {label}
    </Badge>
  )
}
