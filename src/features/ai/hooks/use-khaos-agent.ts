import { useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
    ChatMessageRoleUser,
    ChatMessageRoleAssistant,
    ChatMessageContentTypeText,
    ChatMessageStatusReady,
    ChatMessageStatusPending,
    type ChatMessageDTO
} from '@inferencesh/sdk';
import { useAI } from '@/contexts/AIProvider';
import { createWebLLM } from '../services/web-llm-provider';

/**
 * useKhaosAgent - Bridge hook between Vercel AI SDK and Inference UI
 * Supports Hybrid Engine (Cloud/Local) and Reasoning
 */
export function useKhaosAgent() {
    const { mode, byokSettings } = useAI();
    const [localInput, setLocalInput] = useState('');
    const [artifact, setArtifact] = useState<{ title: string; content: string; type: 'document' | 'code'; isOpen: boolean } | null>(null);
    const [localProgress, setLocalProgress] = useState<{ progress: number; text: string } | null>(null);

    // 1. Contextual Model Selection
    const localModel = useMemo(() => {
        if (mode === 'local') {
            return createWebLLM("Llama-3-8B-q4f16_1-MLC", (report) => {
                setLocalProgress(report);
            });
        }
        return undefined;
    }, [mode]);

    // 2. Setup Vercel useChat
    const chatHelpers = useChat({
        api: mode === 'cloud' ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant` : undefined,
        headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            ...(byokSettings?.apiKey && {
                'x-ai-provider': byokSettings.provider,
                'x-ai-key': byokSettings.apiKey,
                'x-ai-model': byokSettings.modelName,
            })
        },
        // @ts-ignore
        model: mode === 'local' ? localModel : undefined,
        onFinish: ({ message }: { message: any }) => {
            // Artifact detection logic - looking for <artifact title="...">...</artifact>
            const artifactMatch = message.content.match(/<artifact\s+title="([^"]+)"(?:\s+type="([^"]+)")?>([\s\S]*?)<\/artifact>/i);
            if (artifactMatch) {
                setArtifact({
                    title: artifactMatch[1],
                    type: (artifactMatch[2] as any) || 'document',
                    content: artifactMatch[3].trim(),
                    isOpen: true
                });
            }
        }
    } as any) as any;

    // 3. Map Vercel Messages to Inference UI DTOs
    const chatMessages = useMemo((): ChatMessageDTO[] => {
        return (chatHelpers.messages || []).map((m: any) => {
            // Extract reasoning if available (Vercel AI SDK 3.x parts)
            const reasoning = m.parts?.find((p: any) => p.type === 'reasoning')?.reasoning ||
                m.reasoning || // Backup for older versions or custom implementation
                null;

            return {
                id: m.id,
                role: m.role,
                content: [
                    {
                        type: ChatMessageContentTypeText,
                        // Clean content for chat bubble (strip artifact tags)
                        text: m.content.replace(/<artifact[\s\S]*?<\/artifact>/gi, '').trim()
                    }
                ],
                // @ts-ignore - Adding custom field for reasoning component
                reasoning: reasoning,
                status: ChatMessageStatusReady,
                created_at: m.createdAt?.toISOString() || new Date().toISOString(),
                tool_invocations: m.toolInvocations?.map((ti: any) => ({
                    id: ti.toolCallId,
                    status: ti.state,
                    function: {
                        name: ti.toolName,
                        arguments: ti.args
                    },
                    result: ti.result
                }))
            };
        });
    }, [chatHelpers.messages, chatHelpers.status]);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!localInput.trim()) return;

        chatHelpers.append({
            role: 'user',
            content: localInput
        });
        setLocalInput('');
    };

    return {
        messages: chatMessages,
        input: localInput,
        setInput: setLocalInput,
        handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalInput(e.target.value),
        handleSubmit,
        isGenerating: chatHelpers.status === 'streaming' || chatHelpers.status === 'submitted',
        stop: chatHelpers.stop,
        error: chatHelpers.error?.message,
        sendMessage: (content: string) => chatHelpers.sendMessage({ role: 'user', content }),
        artifact,
        closeArtifact: () => setArtifact(prev => prev ? { ...prev, isOpen: false } : null),
        localProgress,
    };
}
