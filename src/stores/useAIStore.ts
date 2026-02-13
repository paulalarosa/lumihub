import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Widget {
    id: string;
    type: 'chart' | 'table' | 'card' | 'calendar' | 'form' | 'stats_card' | 'events_table' | 'client_card';
    data: any;
    props?: any;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    reasoning?: string;
    widgets?: Widget[];
    canvasId?: string;
}

export interface Canvas {
    id: string;
    title: string;
    content: string;
    type: 'markdown' | 'html' | 'contract' | 'script';
    createdAt: string;
    updatedAt: string;
}

interface UserAPIKeys {
    gemini?: string;
    openai?: string;
}

interface AISettings {
    provider: 'gemini' | 'openai' | 'local';
    model: string;
    temperature: number;
    maxTokens: number;
    useLocalAI: boolean;
}

interface AIStore {
    // Conversas
    conversations: Record<string, Message[]>;
    currentConversationId: string | null;

    // Canvas/Artifacts
    canvases: Canvas[];
    activeCanvasId: string | null;

    // Settings
    settings: AISettings;
    userAPIKeys: UserAPIKeys;

    // UI State
    isChatOpen: boolean;
    isCanvasOpen: boolean;

    // Actions
    addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
    updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
    createConversation: () => string;
    setCurrentConversation: (id: string) => void;
    clearConversation: (id: string) => void;

    createCanvas: (canvas: Omit<Canvas, 'id' | 'createdAt' | 'updatedAt'>) => string;
    updateCanvas: (id: string, updates: Partial<Canvas>) => void;
    setActiveCanvas: (id: string | null) => void;

    updateSettings: (settings: Partial<AISettings>) => void;
    setUserAPIKey: (provider: 'gemini' | 'openai', key: string) => void;
    clearUserAPIKey: (provider: 'gemini' | 'openai') => void;

    toggleChat: () => void;
    toggleCanvas: () => void;
}

export const useAIStore = create<AIStore>()(
    persist(
        (set, get) => ({
            conversations: {},
            currentConversationId: null,
            canvases: [],
            activeCanvasId: null,

            settings: {
                provider: 'gemini',
                model: 'gemini-2.0-flash-exp',
                temperature: 0.7,
                maxTokens: 2048,
                useLocalAI: false,
            },

            userAPIKeys: {},
            isChatOpen: false,
            isCanvasOpen: false,

            addMessage: (conversationId, message) => {
                const newMessage: Message = {
                    ...message,
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                };

                set((state) => ({
                    conversations: {
                        ...state.conversations,
                        [conversationId]: [
                            ...(state.conversations[conversationId] || []),
                            newMessage,
                        ],
                    },
                }));
            },

            updateMessage: (conversationId, messageId, updates) => {
                set((state) => ({
                    conversations: {
                        ...state.conversations,
                        [conversationId]: state.conversations[conversationId]?.map((msg) =>
                            msg.id === messageId ? { ...msg, ...updates } : msg
                        ),
                    },
                }));
            },

            createConversation: () => {
                const id = crypto.randomUUID();
                set((state) => ({
                    conversations: { ...state.conversations, [id]: [] },
                    currentConversationId: id,
                }));
                return id;
            },

            setCurrentConversation: (id) => {
                set({ currentConversationId: id });
            },

            clearConversation: (id) => {
                set((state) => {
                    const conversations = { ...state.conversations };
                    delete conversations[id];
                    return {
                        conversations,
                        currentConversationId:
                            state.currentConversationId === id ? null : state.currentConversationId,
                    };
                });
            },

            createCanvas: (canvas) => {
                const id = crypto.randomUUID();
                const newCanvas: Canvas = {
                    ...canvas,
                    id,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                set((state) => ({
                    canvases: [...state.canvases, newCanvas],
                    activeCanvasId: id,
                    isCanvasOpen: true,
                }));

                return id;
            },

            updateCanvas: (id, updates) => {
                set((state) => ({
                    canvases: state.canvases.map((canvas) =>
                        canvas.id === id
                            ? { ...canvas, ...updates, updatedAt: new Date().toISOString() }
                            : canvas
                    ),
                }));
            },

            setActiveCanvas: (id) => {
                set({ activeCanvasId: id, isCanvasOpen: !!id });
            },

            updateSettings: (settings) => {
                set((state) => ({
                    settings: { ...state.settings, ...settings },
                }));
            },

            setUserAPIKey: (provider, key) => {
                set((state) => ({
                    userAPIKeys: { ...state.userAPIKeys, [provider]: key },
                }));
            },

            clearUserAPIKey: (provider) => {
                set((state) => {
                    const keys = { ...state.userAPIKeys };
                    delete keys[provider];
                    return { userAPIKeys: keys };
                });
            },

            toggleChat: () => {
                set((state) => ({ isChatOpen: !state.isChatOpen }));
            },

            toggleCanvas: () => {
                set((state) => ({ isCanvasOpen: !state.isCanvasOpen }));
            },
        }),
        {
            name: 'khaos-ai-store',
            partialize: (state) => ({
                conversations: state.conversations,
                canvases: state.canvases,
                settings: state.settings,
                userAPIKeys: state.userAPIKeys,
            }),
        }
    )
);
