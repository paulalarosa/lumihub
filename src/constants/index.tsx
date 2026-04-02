import {
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  XCircleIcon,
} from 'lucide-react'
import React from 'react'

export const ICON_SIZE = 18
export const ANIMATION_DURATION = 0.3

export const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024
export const DEFAULT_AI_MODEL = 'gpt-4-turbo'

export const TOOL_STATUS_LABELS: Record<string, string> = {
  'approval-requested': 'Awaiting Approval',
  'approval-responded': 'Responded',
  'input-available': 'Running',
  'input-streaming': 'Pending',
  'output-available': 'Completed',
  'output-denied': 'Denied',
  'output-error': 'Error',
}

export const TOOL_STATUS_ICONS: Record<string, React.ReactNode> = {
  'approval-requested': <ClockIcon className="size-4 text-yellow-600" />,
  'approval-responded': <CheckCircleIcon className="size-4 text-blue-600" />,
  'input-available': <ClockIcon className="size-4 animate-pulse" />,
  'input-streaming': <CircleIcon className="size-4" />,
  'output-available': <CheckCircleIcon className="size-4 text-green-600" />,
  'output-denied': <XCircleIcon className="size-4 text-orange-600" />,
  'output-error': <XCircleIcon className="size-4 text-red-600" />,
}
