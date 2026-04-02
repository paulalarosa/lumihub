import { useState, useEffect, useRef, useCallback } from 'react'
import type { TaskDTO as Task } from '@inferencesh/sdk'
import type { AgentClient } from '@inferencesh/sdk/agent'
import {
  StreamManager,
  TaskStatusCompleted,
  TaskStatusFailed,
  TaskStatusCancelled,
} from '@inferencesh/sdk'

export interface UseTaskOptions {
  client: AgentClient

  taskId: string

  onUpdate?: (task: Task) => void

  onComplete?: (task: Task) => void

  onError?: (error: Error) => void

  autoReconnect?: boolean

  maxReconnects?: number
}

export interface UseTaskResult {
  task: Task | null

  isLoading: boolean

  isStreaming: boolean

  error: Error | null

  refetch: () => Promise<void>

  stopStream: () => void
}

export function isTerminalStatus(status: number | undefined): boolean {
  return (
    status !== undefined &&
    [TaskStatusCompleted, TaskStatusFailed, TaskStatusCancelled].includes(
      status,
    )
  )
}

export function useTask({
  client,
  taskId,
  onUpdate,
  onComplete,
  onError,
  autoReconnect = true,
  maxReconnects = 5,
}: UseTaskOptions): UseTaskResult {
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const streamManagerRef = useRef<StreamManager<Task> | null>(null)
  const taskRef = useRef<Task | null>(null)

  useEffect(() => {
    taskRef.current = task
  }, [task])

  const stopStream = useCallback(() => {
    if (streamManagerRef.current) {
      streamManagerRef.current.stop()
      streamManagerRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const startStream = useCallback(() => {
    if (!taskId || !client) return

    stopStream()

    const manager = new StreamManager<Task>({
      createEventSource: async () => {
        return client.http.createEventSource(`/tasks/${taskId}/stream`)
      },
      autoReconnect,
      maxReconnects,
      reconnectDelayMs: 1000,
      onStart: () => setIsStreaming(true),
      onStop: () => setIsStreaming(false),
      onError: (err) => {
        setError(err)
        onError?.(err)
      },
      onData: (taskData: Task) => {
        setTask(taskData)
        onUpdate?.(taskData)

        if (isTerminalStatus(taskData.status)) {
          onComplete?.(taskData)
          manager.stopAfter(500)
        }
      },
      onPartialData: (partialData: Task, fields: string[]) => {
        const currentTask = taskRef.current
        if (currentTask) {
          const updates = fields.reduce((acc, field) => {
            const key = field as keyof Task
            ;(acc as Record<string, unknown>)[key] = partialData[key]
            return acc
          }, {} as Partial<Task>)
          const mergedTask = { ...currentTask, ...updates }
          setTask(mergedTask)
          onUpdate?.(mergedTask)

          if (isTerminalStatus(mergedTask.status)) {
            onComplete?.(mergedTask)
            manager.stopAfter(500)
          }
        } else {
          setTask(partialData)
          onUpdate?.(partialData)
        }
      },
    })

    streamManagerRef.current = manager
    manager.connect()
  }, [
    taskId,
    client,
    autoReconnect,
    maxReconnects,
    onUpdate,
    onComplete,
    onError,
    stopStream,
  ])

  const fetchTask = useCallback(async () => {
    if (!taskId || !client) return

    setIsLoading(true)
    setError(null)

    try {
      const taskData = await client.http.request<Task>(
        'get',
        `/tasks/${taskId}`,
      )

      setTask(taskData)
      onUpdate?.(taskData)

      if (!isTerminalStatus(taskData.status)) {
        startStream()
      } else {
        onComplete?.(taskData)
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to fetch task')
      setError(error)
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [taskId, client, onUpdate, onComplete, onError, startStream])

  useEffect(() => {
    fetchTask()

    return () => {
      stopStream()
    }
  }, [taskId])

  return {
    task,
    isLoading,
    isStreaming,
    error,
    refetch: fetchTask,
    stopStream,
  }
}
