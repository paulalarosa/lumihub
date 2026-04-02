import React, { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChatMessageRoleUser } from '@inferencesh/sdk'
import type { ChatMessageDTO } from '@inferencesh/sdk/agent'

interface MessageBubbleProps {
  message: ChatMessageDTO
  children?: ReactNode
  className?: string
}

export const MessageBubble = memo(function MessageBubble({
  message,
  children,
  className,
}: MessageBubbleProps) {
  const isUser = message.role === ChatMessageRoleUser

  return (
    <div
      className={cn(
        'group relative w-full',
        isUser ? 'flex justify-end' : 'flex justify-start',
        className,
      )}
    >
      <div
        className={cn(
          'relative rounded-xl text-sm',
          isUser
            ? 'bg-muted/50 text-foreground max-w-[70%] min-w-0 p-3'
            : 'text-foreground max-w-full min-w-0',
        )}
      >
        {children}
      </div>
    </div>
  )
})

MessageBubble.displayName = 'MessageBubble'
