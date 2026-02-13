import { useState, useRef, useEffect } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { useAIStore } from '@/stores/useAIStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, X, Sparkles, FileText, CornerDownLeft, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Widgets dinâmicos
import { StatsCard } from './widgets/StatsCard';
import { EventsTable } from './widgets/EventsTable';
import { ClientCard } from './widgets/ClientCard';

const PROMPT_STARTERS = [
    { label: 'CALENDAR_FETCH', icon: <Sparkles className="h-3 w-3" />, prompt: 'Meus próximos eventos' },
    { label: 'FINANCE_SYNC', icon: <Shield className="h-3 w-3" />, prompt: 'Resumo financeiro do mês' },
    { label: 'LEAD_QUERY', icon: <Bot className="h-3 w-3" />, prompt: 'Ver meus clientes ativos' },
    { label: 'DocGEN_INIT', icon: <FileText className="h-3 w-3" />, prompt: 'Criar contrato de noiva' },
];

import { AISettingsModal } from './settings/AISettingsModal';
import { Settings } from 'lucide-react';

export const ModernAIChat = () => {
    const { isChatOpen, toggleChat, setActiveCanvas } = useAIStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { messages, isLoading, sendMessage } = useAIChat();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        sendMessage(input);
        setInput('');
    };

    const renderWidget = (widget: any) => {
        switch (widget.type) {
            case 'stats_card':
                return <StatsCard key={widget.id} data={widget.data} />;
            case 'events_table':
                return <EventsTable key={widget.id} events={widget.data.events} />;
            case 'client_card':
                return <ClientCard key={widget.id} client={widget.data} />;
            default:
                return null;
        }
    };

    return (
        <>
            {/* FAB - Industrial Noir style */}
            <button
                onClick={toggleChat}
                className={cn(
                    "fixed bottom-6 right-6 w-14 h-14 bg-black border-2 border-white/20 hover:border-white transition-all z-50 rounded-none overflow-hidden group",
                    isChatOpen && "rotate-90 opacity-0 pointer-events-none"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent group-hover:bg-white/10 transition-colors" />
                <Bot className="w-6 h-6 text-white relative z-10 m-auto" />
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500/50 animate-pulse" />
            </button>

            {/* Main Chat Panel */}
            <div className={cn(
                "fixed bottom-6 right-6 w-full max-w-[450px] h-[700px] bg-black border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] z-50 flex flex-col transition-all duration-500 transform rounded-none overflow-hidden",
                isChatOpen ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
            )}>
                {/* Header - Serialized & High-Tech */}
                <div className="p-4 border-b border-white/5 bg-zinc-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-white/5 border border-white/10 flex items-center justify-center rounded-none rotate-45">
                            <Bot className="h-5 w-5 text-white -rotate-45" />
                        </div>
                        <div>
                            <h3 className="text-[11px] font-mono tracking-[0.2em] text-white uppercase font-bold">Khaos Protocol</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Stream Active</span>
                                <div className="h-1 w-1 bg-emerald-500/50 rounded-full" />
                                <span className="text-[9px] font-mono text-emerald-500/50 uppercase">v4.0.1</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={toggleChat} className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Messaging Core */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-8">
                            <div className="flex flex-col items-center space-y-4 opacity-20 grayscale">
                                <Bot className="h-16 w-16 text-white" />
                                <div className="space-y-1 text-center">
                                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold">Standby Mode</p>
                                    <p className="text-[9px] font-mono uppercase tracking-widest italic">Iniciando interface de comando...</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                                {PROMPT_STARTERS.map((s, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => sendMessage(s.prompt)}
                                        className="flex items-center gap-3 p-3 bg-zinc-950 border border-white/5 hover:border-white/20 hover:bg-zinc-900 transition-all text-left rounded-none group"
                                    >
                                        <div className="text-zinc-500 group-hover:text-white transition-colors">
                                            {s.icon}
                                        </div>
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                            {s.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((m, idx) => (
                            <div key={m.id} className={cn("flex flex-col space-y-4", m.role === 'user' ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "flex gap-4 max-w-[90%]",
                                    m.role === 'user' && "flex-row-reverse"
                                )}>
                                    <div className="shrink-0 mt-1">
                                        {m.role === 'user' ? (
                                            <div className="h-7 w-7 bg-white/5 border border-white/10 flex items-center justify-center rounded-none">
                                                <span className="text-[8px] font-mono text-zinc-500">USR</span>
                                            </div>
                                        ) : (
                                            <div className="h-7 w-7 bg-white/10 border border-white/20 flex items-center justify-center rounded-none shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                                <Bot className="h-3.5 w-3.5 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className={cn(
                                        "space-y-4",
                                        m.role === 'user' ? "text-right" : "text-left"
                                    )}>
                                        {m.reasoning && (
                                            <div className="bg-white/5 border-l border-white/20 p-3 mb-2">
                                                <p className="text-[9px] font-mono uppercase text-zinc-500 mb-1 flex items-center gap-2">
                                                    <Sparkles className="h-2.5 w-2.5" />
                                                    Neural_Reasoning
                                                </p>
                                                <p className="text-[11px] font-mono text-zinc-400 italic leading-relaxed">
                                                    {m.reasoning}
                                                </p>
                                            </div>
                                        )}

                                        <div className={cn(
                                            "prose prose-sm prose-invert max-w-none text-[13px] leading-relaxed",
                                            m.role === 'user' ? "text-zinc-300" : "text-zinc-200"
                                        )}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {m.content}
                                            </ReactMarkdown>
                                        </div>

                                        {m.widgets && (
                                            <div className="space-y-3 pt-2">
                                                {m.widgets.map(renderWidget)}
                                            </div>
                                        )}

                                        {m.canvasId && (
                                            <button
                                                onClick={() => setActiveCanvas(m.canvasId!)}
                                                className="flex items-center gap-2 px-3 py-2 border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 text-[10px] font-mono uppercase tracking-widest transition-all"
                                            >
                                                <FileText className="h-3 w-3" />
                                                Execute_Canvas_Mount
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="flex items-center gap-3 opacity-30">
                            <div className="flex gap-1">
                                <div className="h-1 w-1 bg-white animate-bounce [animation-delay:-0.3s]" />
                                <div className="h-1 w-1 bg-white animate-bounce [animation-delay:-0.15s]" />
                                <div className="h-1 w-1 bg-white animate-bounce" />
                            </div>
                            <span className="text-[8px] font-mono uppercase tracking-[0.2em]">Neural_Processing</span>
                        </div>
                    )}
                </div>

                {/* Input - Command Line Inspired */}
                <div className="p-6 bg-zinc-950/80 border-t border-white/5 backdrop-blur-md">
                    <div className="relative group">
                        <div className="relative flex flex-col bg-zinc-900/50 border border-white/10 rounded-none focus-within:border-white/30 transition-all duration-300">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Digital signature required..."
                                disabled={isLoading}
                                className="bg-transparent border-none focus-visible:ring-0 text-[13px] font-mono text-white placeholder:text-zinc-600 h-14 px-4"
                            />

                            <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-t border-white/5">
                                <div className="flex items-center gap-1.5 opacity-40">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">System_Encrypted</span>
                                </div>

                                <Button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    size="sm"
                                    className="h-7 px-4 bg-white text-black text-[10px] font-mono uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-30 rounded-none"
                                >
                                    <span>Execute</span>
                                    <CornerDownLeft className="h-3 w-3 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <p className="mt-3 text-[7px] font-mono text-zinc-700 uppercase tracking-widest text-center">
                        Khaos Kontrol Enterprise AI Protocol v4.0.1
                    </p>
                </div>
            </div>

            <AISettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    );
};
