import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/page-loader'

export interface MessageStatusIndicatorProps {
  className?: string

  size?: number

  showLabel?: boolean

  label?: string
}

export const MessageStatusIndicator = memo(function MessageStatusIndicator({
  className,
  size = 18,
  showLabel = true,
  label = 'generating...',
}: MessageStatusIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-muted-foreground py-1',
        className,
      )}
    >
      <Spinner className="size-4" style={{ width: size, height: size }} />
      {showLabel && <span className="text-xs opacity-70">{label}</span>}
    </div>
  )
})

MessageStatusIndicator.displayName = 'MessageStatusIndicator'

