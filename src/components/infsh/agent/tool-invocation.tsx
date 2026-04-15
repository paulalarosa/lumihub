import React, { memo, useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { logger } from '@/services/logger'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  MessageCircleCode,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  CheckCircle,
  CircleDashed,
} from 'lucide-react'
import { Spinner } from '@/components/ui/PageLoader'
import { Button } from '@/components/ui/button'
import {
  ToolInvocationStatusPending,
  ToolInvocationStatusInProgress,
  ToolInvocationStatusAwaitingInput,
  ToolInvocationStatusAwaitingApproval,
  ToolInvocationStatusCompleted,
  ToolInvocationStatusFailed,
  ToolInvocationStatusCancelled,
  ToolTypeApp,
  type ToolInvocationDTO,
} from '@inferencesh/sdk'
import {
  useAgentActions,
  useAgentClient,
  type UploadedFile,
} from '@inferencesh/sdk/agent'
import { WidgetRenderer } from '@/components/infsh/agent/widget-renderer'
import {
  parseWidget,
  type WidgetAction,
  type WidgetFormData,
} from '@/components/infsh/agent/widget-types'
import { TaskOutputWrapper } from '@/components/infsh/task/task-output-wrapper'

const ToolFinishStatusSucceeded = 'succeeded'
const ToolFinishStatusFailed = 'failed'
const ToolFinishStatusCancelled = 'cancelled'

interface ToolFinish {
  status: string
  result?: unknown
  error?: string
}

interface ToolInvocationProps {
  invocation: ToolInvocationDTO
  className?: string
  defaultOpen?: boolean
}

const FinishBlock = memo(function FinishBlock({
  finish,
  isActive = false,
}: {
  finish?: ToolFinish | null
  isActive?: boolean
}) {
  const getStatusIcon = () => {
    if (isActive) {
      return <Spinner className="size-3.5" />
    }
    switch (finish?.status) {
      case ToolFinishStatusSucceeded:
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
      case ToolFinishStatusFailed:
        return <XCircle className="h-3.5 w-3.5 text-red-400" />
      case ToolFinishStatusCancelled:
        return <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />
      default:
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
    }
  }

  const getStatusText = () => {
    if (isActive) return 'finishing'
    switch (finish?.status) {
      case ToolFinishStatusSucceeded:
        return 'completed'
      case ToolFinishStatusFailed:
        return 'failed'
      case ToolFinishStatusCancelled:
        return 'cancelled'
      default:
        return 'completed'
    }
  }

  const getLineColor = () => {
    switch (finish?.status) {
      case ToolFinishStatusFailed:
        return 'bg-red-400/30'
      case ToolFinishStatusCancelled:
        return 'bg-muted-foreground/30'
      default:
        return 'bg-muted-foreground/20'
    }
  }

  const resultMessage =
    finish?.result && typeof finish.result === 'string' && !isActive
      ? finish.result.toLowerCase()
      : null

  return (
    <div className="my-6 w-full">
      <div className="flex items-center gap-4 w-full">
        <div className={cn('flex-1 h-px', getLineColor())} />
        <div
          className={cn(
            'flex items-center gap-2 text-muted-foreground/50',
            isActive && 'animate-pulse',
          )}
        >
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusText()}</span>
        </div>
        <div className={cn('flex-1 h-px', getLineColor())} />
      </div>
      {resultMessage && (
        <p className="text-xs text-muted-foreground/40 text-center mt-2 break-words">
          {resultMessage}
        </p>
      )}
    </div>
  )
})

export const ToolInvocation = memo(function ToolInvocation({
  invocation,
  className,
  defaultOpen = false,
}: ToolInvocationProps) {
  const widget = useMemo(() => {
    if (invocation.widget) {
      return parseWidget(invocation.widget)
    }
    if (invocation.result) {
      return parseWidget(invocation.result)
    }
    return null
  }, [invocation.widget, invocation.result])

  const isAwaitingApprovalStatus =
    invocation.status === ToolInvocationStatusAwaitingApproval
  const [isOpen, setIsOpen] = useState(
    defaultOpen || isAwaitingApprovalStatus || !!widget,
  )

  const {
    submitToolResult,
    approveTool,
    rejectTool,
    alwaysAllowTool,
    sendMessage,
  } = useAgentActions()
  const client = useAgentClient()

  const functionName = invocation.function?.name || 'tool'

  const status = invocation.status
  const isActive =
    status === ToolInvocationStatusInProgress ||
    status === ToolInvocationStatusAwaitingInput ||
    status === ToolInvocationStatusPending

  const isAppTool = invocation.type === ToolTypeApp

  const taskId = useMemo(() => {
    if (invocation.execution_id) {
      return invocation.execution_id
    }

    if (isAppTool && typeof invocation.result === 'string') {
      const match = invocation.result.match(/^Task\s+([a-z0-9]+)\s+/)
      if (match) {
        return match[1]
      }
    }
    return null
  }, [invocation.execution_id, invocation.result, isAppTool])

  const hasTaskOutput = isAppTool && taskId

  const isFinishTool = functionName === 'finish'

  const finishData = useMemo((): ToolFinish | null => {
    if (!isFinishTool) return null

    if (invocation.data) {
      try {
        const data =
          typeof invocation.data === 'string'
            ? JSON.parse(invocation.data)
            : invocation.data
        if (data && typeof data.status === 'string') {
          return data as ToolFinish
        }
      } catch (_e) {
        /* empty catch intended for non-parseable data */
      }
    }

    if (invocation.function?.arguments) {
      const args = invocation.function.arguments
      if (args.status && typeof args.status === 'string') {
        return {
          status: args.status as string,
          result: args.result as string | undefined,
        }
      }
    }

    return null
  }, [isFinishTool, invocation.data, invocation.function?.arguments])

  const statusIcon = useMemo(() => {
    switch (status) {
      case ToolInvocationStatusPending:
      case ToolInvocationStatusInProgress:
        return <Spinner className="size-3" />
      case ToolInvocationStatusAwaitingInput:
      case ToolInvocationStatusAwaitingApproval:
        return <Clock className="h-3 w-3" />
      case ToolInvocationStatusCompleted:
        return <CheckCircle2 className="h-3 w-3 text-emerald-400" />
      case ToolInvocationStatusFailed:
        return <AlertCircle className="h-3 w-3 text-red-400" />
      case ToolInvocationStatusCancelled:
        return <XCircle className="h-3 w-3 text-muted-foreground" />
      default:
        return <MessageCircleCode className="h-3 w-3" />
    }
  }, [status])

  const statusText = useMemo(() => {
    switch (status) {
      case ToolInvocationStatusPending:
        return 'pending'
      case ToolInvocationStatusInProgress:
        return 'running'
      case ToolInvocationStatusAwaitingInput:
        return 'awaiting input'
      case ToolInvocationStatusAwaitingApproval:
        return 'awaiting approval'
      case ToolInvocationStatusCompleted:
        return 'completed'
      case ToolInvocationStatusFailed:
        return 'failed'
      case ToolInvocationStatusCancelled:
        return 'cancelled'
      default:
        return ''
    }
  }, [status])

  const handleWidgetAction = useCallback(
    async (action: WidgetAction, formData?: WidgetFormData) => {
      const isAwaitingInput = status === ToolInvocationStatusAwaitingInput

      if (isAwaitingInput) {
        if (!submitToolResult) return
        try {
          await submitToolResult(
            invocation.id,
            JSON.stringify({ action, form_data: formData }),
          )
        } catch (error) {
          logger.error(
            '[ToolInvocation] Failed to submit widget action:',
            error,
          )
        }
      } else {
        if (!sendMessage) return
        try {
          const actionText =
            action.payload?.message || action.payload?.text || action.type

          const files: UploadedFile[] = []
          if (action.payload?.image_uri) {
            files.push({
              uri: action.payload.image_uri as string,
              content_type: 'image/png',
            })
          }
          await sendMessage(
            String(actionText),
            files.length > 0 ? files : undefined,
          )
        } catch (error) {
          logger.error(
            '[ToolInvocation] Failed to send widget action as message:',
            error,
          )
        }
      }
    },
    [invocation.id, status, submitToolResult, sendMessage],
  )

  const handleApprove = useCallback(async () => {
    try {
      await approveTool(invocation.id)
    } catch (error) {
      logger.error('[ToolInvocation] Failed to approve:', error)
    }
  }, [invocation.id, approveTool])

  const handleReject = useCallback(async () => {
    try {
      await rejectTool(invocation.id)
    } catch (error) {
      logger.error('[ToolInvocation] Failed to reject:', error)
    }
  }, [invocation.id, rejectTool])

  const handleAlwaysAllow = useCallback(async () => {
    try {
      await alwaysAllowTool(invocation.id, functionName)
    } catch (error) {
      logger.error('[ToolInvocation] Failed to always-allow:', error)
    }
  }, [invocation.id, functionName, alwaysAllowTool])

  const hasArgs =
    invocation.function?.arguments &&
    Object.keys(invocation.function.arguments).length > 0
  const hasResult = !!invocation.result && !widget && !hasTaskOutput

  const isWidgetInteractive =
    status === ToolInvocationStatusAwaitingInput ||
    status === ToolInvocationStatusCompleted

  if (isFinishTool && (finishData || isActive)) {
    return <FinishBlock finish={finishData} isActive={isActive} />
  }

  if (isAwaitingApprovalStatus) {
    if (widget) {
      return (
        <div className={cn('flex flex-col items-start', className)}>
          <WidgetRenderer
            widget={widget}
            onAction={handleWidgetAction}
            className="max-w-md"
          />
        </div>
      )
    }

    return (
      <div className={cn('flex flex-col items-start', className)}>
        <div className="overflow-hidden rounded border bg-muted/10">
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
            {statusIcon}
            <span className="lowercase">
              {functionName} {statusText}
            </span>
          </div>

          {hasArgs && (
            <div className="border-t px-2 py-1.5 text-xs">
              <div className="text-muted-foreground/50 mb-1">arguments:</div>
              <pre className="text-muted-foreground whitespace-pre-wrap overflow-y-auto max-h-[150px]">
                {JSON.stringify(invocation.function?.arguments, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t px-2 py-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleReject}
            >
              skip
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-emerald-400 hover:text-emerald-400/80 hover:bg-emerald-400/10"
              onClick={handleApprove}
            >
              allow
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-blue-400 hover:text-blue-400/80 hover:bg-blue-400/10"
              onClick={handleAlwaysAllow}
            >
              always allow
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (hasTaskOutput) {
    return (
      <div className={cn('flex flex-col items-start', className)}>
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className={cn(
            'group w-full overflow-hidden rounded text-muted-foreground',
            isOpen && 'border bg-muted/10',
          )}
        >
          <div className="flex items-center px-1 py-0.5">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
                {statusIcon}
                <span className={cn('lowercase', isActive && 'animate-pulse')}>
                  {functionName} {statusText}
                </span>
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="border-t p-2">
              <TaskOutputWrapper
                client={client}
                taskId={taskId!}
                compact={true}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }

  if (widget) {
    return (
      <div className={cn('flex flex-col items-start flex-grow-0', className)}>
        <WidgetRenderer
          widget={widget}
          onAction={handleWidgetAction}
          disabled={!isWidgetInteractive}
        />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-start w-fit', className)}>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn(
          'group w-full overflow-hidden rounded text-muted-foreground',
          isOpen && 'border bg-muted/10',
        )}
      >
        <div className="flex items-center px-1 py-0.5">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
              {statusIcon}
              <span className={cn('lowercase', isActive && 'animate-pulse')}>
                {functionName} {statusText}
              </span>
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="border-t px-2 py-1.5 text-xs space-y-1.5">
            {hasArgs && (
              <div>
                <div className="text-muted-foreground/50 mb-1">arguments:</div>
                <pre className="text-muted-foreground whitespace-pre-wrap overflow-y-auto max-h-[150px]">
                  {JSON.stringify(invocation.function?.arguments, null, 2)}
                </pre>
              </div>
            )}
            {hasResult && (
              <div>
                <div className="text-muted-foreground/50 mb-1">result:</div>
                <pre className="text-foreground whitespace-pre-wrap overflow-y-auto max-h-[150px]">
                  {typeof invocation.result === 'string'
                    ? invocation.result
                    : JSON.stringify(invocation.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
})

ToolInvocation.displayName = 'ToolInvocation'
