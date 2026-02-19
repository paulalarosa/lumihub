import { useState, useEffect, useCallback } from 'react';
import { CreateMLCEngine, type MLCEngineInterface } from '@mlc-ai/web-llm';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Modelos disponíveis (otimizados para navegador)
const AVAILABLE_MODELS = [
    {
        id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
        name: 'Llama 3.2 3B',
        size: '1.9 GB',
        description: 'Rápido e eficiente (Meta)',
    },
    {
        id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
        name: 'Phi 3.5 Mini',
        size: '2.2 GB',
        description: 'Melhor qualidade (Microsoft)',
    },
];

export const useWebLLM = () => {
    const { hasFeature } = usePlanAccess();
    const [engine, setEngine] = useState<MLCEngineInterface | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);

    const hasAccess = hasFeature('ia_local');

    const initializeEngine = useCallback(async () => {
        if (!hasAccess) {
            toast.error('IA Local disponível apenas no plano Studio');
            return;
        }

        setIsLoading(true);
        setLoadProgress(0);

        try {
            const engineInstance = await CreateMLCEngine(selectedModel, {
                initProgressCallback: (progress) => {
                    setLoadProgress(Math.round(progress.progress * 100));
                },
            });

            setEngine(engineInstance);
            setIsInitialized(true);
            toast.success('IA Local inicializada!');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            toast.error('Erro ao inicializar IA Local: ' + message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedModel, hasAccess]);

    const chat = useCallback(
        async (messages: Array<{ role: string; content: string }>) => {
            if (!engine) {
                throw new Error('Engine não inicializada');
            }

            const completion = await engine.chat.completions.create({
                messages: messages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
                temperature: 0.7,
                max_tokens: 1024,
            });

            return completion.choices[0].message.content;
        },
        [engine]
    );

    const unloadEngine = useCallback(async () => {
        if (engine) {
            await engine.unload();
            setEngine(null);
            setIsInitialized(false);
            setLoadProgress(0);
            toast.info('IA Local descarregada');
        }
    }, [engine]);

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            if (engine) {
                engine.unload().catch((err: unknown) => logger.error(err, { message: 'Erro ao descarregar IA local.', showToast: false }));
            }
        };
    }, [engine]);

    return {
        engine,
        isLoading,
        isInitialized,
        loadProgress,
        selectedModel,
        availableModels: AVAILABLE_MODELS,
        hasAccess,
        setSelectedModel,
        initializeEngine,
        chat,
        unloadEngine,
    };
};
