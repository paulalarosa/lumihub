import { useState, useCallback } from 'react';
import { useAIStore } from '@/stores/useAIStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useWebLLM } from '@/hooks/useWebLLM';
import { toast } from 'sonner';

export const useAIChat = () => {
    const { user } = useAuth();
    const { checkFeatureAccess } = usePlanAccess();
    const { engine: webLLMEngine, isInitialized: isWebLLMReady } = useWebLLM();

    const {
        conversations,
        currentConversationId,
        settings,
        userAPIKeys,
        addMessage,
        updateMessage,
        createConversation,
        createCanvas,
    } = useAIStore();

    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = useCallback(async (content: string) => {
        if (!user) {
            toast.error('Você precisa estar logado para interagir com a Khaos AI.');
            return;
        }

        // Verificar acesso à IA (Feature Check)
        const access = await checkFeatureAccess('ia_operacional');
        if (!access.allowed) {
            toast.error(`A Khaos AI está disponível apenas nos planos ${access.required_plan} ou superior.`);
            return;
        }

        // Criar conversa se não existir
        let conversationId = currentConversationId;
        if (!conversationId) {
            conversationId = createConversation();
        }

        // Adicionar mensagem do usuário
        addMessage(conversationId, {
            role: 'user',
            content,
        });

        setIsLoading(true);

        try {
            const messages = (useAIStore.getState().conversations[conversationId] || []);

            if (settings.useLocalAI && isWebLLMReady && webLLMEngine) {
                // --- 🏠 PROTOCOLO IA LOCAL (TOTAL PRIVACY) ---
                const chatMessages = messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

                const response = await webLLMEngine.chat.completions.create({
                    messages: [...chatMessages, { role: 'user', content }] as any,
                    temperature: settings.temperature,
                    max_tokens: settings.maxTokens,
                });

                const aiResponse = response.choices[0].message.content;

                addMessage(conversationId, {
                    role: 'assistant',
                    content: aiResponse || 'Protocol_Failure: Empty response from local weights.',
                });
            } else {
                // --- ☁️ PROTOCOLO IA CLOUD (ADVANCED ORCHESTRATION) ---
                const { data, error } = await supabase.functions.invoke('ai-chat-advanced', {
                    body: {
                        messages: messages.map(m => ({
                            role: m.role,
                            content: m.content,
                        })),
                        user_id: user.id,
                        api_key: settings.provider === 'gemini' ? userAPIKeys.gemini : userAPIKeys.openai,
                        provider: settings.provider,
                        model: settings.model,
                    },
                });

                if (error) throw error;

                // Adicionar resposta da IA
                const assistantMessageId = crypto.randomUUID();
                addMessage(conversationId, {
                    role: 'assistant',
                    content: data.content,
                    widgets: data.widgets,
                });

                // Se a IA gerou um pedido de criação de Canvas via tool
                if (data.widgets?.some((w: any) => w.type === 'canvas')) {
                    const canvasWidget = data.widgets.find((w: any) => w.type === 'canvas');
                    const canvasId = createCanvas({
                        title: canvasWidget.data.title,
                        content: canvasWidget.data.content,
                        type: canvasWidget.data.type || 'markdown',
                    });

                    // Vincular a mensagem ao novo Canvas
                    updateMessage(conversationId, assistantMessageId, {
                        canvasId,
                    });
                }
            }
        } catch (error: any) {
            console.error('Khaos AI Chat Error:', error);
            toast.error('Ocorreu um erro no protocolo de IA: ' + (error.message || 'Erro desconhecido.'));

            addMessage(conversationId, {
                role: 'assistant',
                content: '🚨 Peço desculpas, Professional. Houve uma instabilidade no meu núcleo de processamento. Poderia repetir o comando?',
            });
        } finally {
            setIsLoading(false);
        }
    }, [
        user,
        currentConversationId,
        settings,
        userAPIKeys,
        addMessage,
        updateMessage,
        createConversation,
        createCanvas,
        checkFeatureAccess,
        webLLMEngine,
        isWebLLMReady,
    ]);

    return {
        messages: currentConversationId ? conversations[currentConversationId] || [] : [],
        isLoading,
        sendMessage,
    };
};
