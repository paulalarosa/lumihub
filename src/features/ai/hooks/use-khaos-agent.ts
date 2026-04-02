import { useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import {
  ChatMessageContentTypeText,
  ChatMessageStatusReady,
  type ChatMessageDTO,
} from '@inferencesh/sdk'
import { useAI } from '@/hooks/useAI'
import { createWebLLM } from '../services/web-llm-provider'

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

  const chatHelpers = useChat({
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
    onFinish: ({ message }: { message: { content: string } }) => {
      const artifactMatch = message.content.match(
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
  })

  const chatMessages = useMemo((): ChatMessageDTO[] => {
    return (chatHelpers.messages || []).map((m: any) => {
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
      }
    })
  }, [chatHelpers.messages, chatHelpers.status])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!localInput.trim()) return

    chatHelpers.append({
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
      chatHelpers.sendMessage({ role: 'user', content }),
    artifact,
    closeArtifact: () =>
      setArtifact((prev) => (prev ? { ...prev, isOpen: false } : null)),
    localProgress,
  }
}
