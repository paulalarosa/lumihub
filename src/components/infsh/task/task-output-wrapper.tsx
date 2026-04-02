'use client'

import React, { memo, useCallback } from 'react'
import type { TaskDTO as Task } from '@inferencesh/sdk'
import type { AgentClient } from '@inferencesh/sdk/agent'
import { cn } from '@/lib/utils'
import { useTask } from '@/hooks/use-task'
import { TaskOutput } from '@/components/infsh/task/task-output'

export interface TaskOutputWrapperProps {
  client: AgentClient

  taskId: string

  className?: string

  compact?: boolean

  showError?: boolean

  onUpdate?: (task: Task) => void

  onComplete?: (task: Task) => void

  onError?: (error: Error) => void

  onCancel?: (taskId: string) => void
}

export const TaskOutputWrapper = memo(function TaskOutputWrapper({
  client,
  taskId,
  className,
  compact = false,
  showError = true,
  onUpdate,
  onComplete,
  onError,
  onCancel,
}: TaskOutputWrapperProps) {
  const { task, isLoading, isStreaming } = useTask({
    client,
    taskId,
    onUpdate,
    onComplete,
    onError,
  })

  const handleCancel = useCallback(async () => {
    if (onCancel) {
      onCancel(taskId)
    } else {
      try {
        await client.http.request('post', `/tasks/${taskId}/cancel`)
      } catch (err) {
        onError?.(
          err instanceof Error ? err : new Error('Failed to cancel task'),
        )
      }
    }
  }, [client, taskId, onCancel, onError])

  return (
    <TaskOutput
      task={task}
      isLoading={isLoading}
      isStreaming={isStreaming}
      className={cn(className)}
      compact={compact}
      showError={showError}
      onCancel={handleCancel}
    />
  )
})
