/// <reference types="vite/client" />
import { useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import {
  ChatMessageContentTypeText,
  ChatMessageStatusReady,
  type ChatMessageDTO,
} from '@inferencesh/sdk'
import { useAI } from '@/hooks/useAI'
import { createWebLLM } from '../services/web-llm-provider'

interface ChatMessage {
  id: string
  role: 'system' | 'user' | 'assistant' | 'data' | 'tool'
  content: string
  createdAt?: Date
  toolInvocations?: Record<string, unknown>[]
  parts?: Record<string, unknown>[]
  reasoning?: string
}

// @ai-sdk/react exposes runtime shapes whose TS types diverge between
// versions we use simultaneously (`ai` v6 vs `@ai-sdk/react` v3). The runtime
// contract is stable; these shims describe what the hook actually accepts so
// callers can stay strict without per-call suppressions.
type OnFinishArg = { message: { content: string } }
type UserMessageInput = { role: 'user'; content: string }
interface ChatHelpersShim {
  append: (msg: UserMessageInput) => void
  sendMessage: (msg: UserMessageInput) => void
}

export function useKhaosAgent() {
  const { mode, byokSettings } = useAI()
  const [localInput, setLocalInput] = useState('')
  const [artifact, setArtifact] = useState<{
    title: string
    content: string
    type: 'document' | 'code'
    isOpen: boolean
  } | null>(null)
  const [localProgress, setLocalProgress] = useState<{
    progress: number
    text: string
  } | null>(null)

  const localModel = useMemo(() => {
    if (mode === 'local') {
      return createWebLLM('Llama-3-8B-q4f16_1-MLC', (report) => {
        setLocalProgress(report)
      })
    }
    return undefined
  }, [mode])

  // AI SDK runtime accepts these fields (`api`, `onFinish`) but the published
  // TS types don't expose them on `UseChatOptions` in the versions we run
  // (`ai` v6 + `@ai-sdk/react` v3). Cast the config once here rather than
  // sprinkling @ts-expect-error across callers.
  const chatConfig = {
    api:
      mode === 'cloud'
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`
        : undefined,
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      ...(byokSettings?.apiKey && {
        'x-ai-provider': byokSettings.provider,
        'x-ai-key': byokSettings.apiKey,
        'x-ai-model': byokSettings.modelName,
      }),
    },
    model: mode === 'local' ? localModel : undefined,
    onFinish: (event: OnFinishArg) => {
      const artifactMatch = event.message.content.match(
        /<artifact\s+title="([^"]+)"(?:\s+type="([^"]+)")?>([\s\S]*?)<\/artifact>/i,
      )
      if (artifactMatch) {
        setArtifact({
          title: artifactMatch[1],
          type: (artifactMatch[2] as 'document' | 'code') || 'document',
          content: artifactMatch[3].trim(),
          isOpen: true,
        })
      }
    },
  }
  const chatHelpers = useChat(
    chatConfig as unknown as Parameters<typeof useChat>[0],
  )
  const chatShim = chatHelpers as unknown as ChatHelpersShim

  const chatMessages = useMemo((): ChatMessageDTO[] => {
    return (chatHelpers.messages as unknown as ChatMessage[] || []).map((m: ChatMessage) => {
      const reasoning =
        (m.parts as Record<string, unknown>[])?.find(
          (p) => p.type === 'reasoning',
        )?.reasoning ||
        m.reasoning ||
        null

      return {
        id: m.id,
        role: m.role,
        content: [
          {
            type: ChatMessageContentTypeText,

            text: m.content
              .replace(/<artifact[\s\S]*?<\/artifact>/gi, '')
              .trim(),
          },
        ],
        reasoning: reasoning,
        status: ChatMessageStatusReady,
        created_at: m.createdAt?.toISOString() || new Date().toISOString(),
        tool_invocations: (m.toolInvocations as Record<string, unknown>[])?.map(
          (ti) => ({
            id: ti.toolCallId as string,
            status: ti.state as string,
            function: {
              name: ti.toolName as string,
              arguments: ti.args as string,
            },
            result: ti.result,
          }),
        ),
      } as unknown as ChatMessageDTO
    })
  }, [chatHelpers.messages])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!localInput.trim()) return

    chatShim.append({
      role: 'user',
      content: localInput,
    })
    setLocalInput('')
  }

  return {
    messages: chatMessages,
    input: localInput,
    setInput: setLocalInput,
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setLocalInput(e.target.value),
    handleSubmit,
    isGenerating:
      chatHelpers.status === 'streaming' || chatHelpers.status === 'submitted',
    stop: chatHelpers.stop,
    error: chatHelpers.error?.message,
    sendMessage: (content: string) =>
      chatShim.sendMessage({ role: 'user', content }),
    artifact,
    closeArtifact: () =>
      setArtifact((prev) => (prev ? { ...prev, isOpen: false } : null)),
    localProgress,
  }
}
