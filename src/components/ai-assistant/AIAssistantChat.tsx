import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Send,
  Loader2,
  Terminal,
  ChevronRight,
  Sparkles,
  Calendar,
  Users,
  Plus,
  FileText,
  CheckCircle2,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { toast } from 'sonner';

// Input validation schema
const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: "Mensagem não pode estar vazia" })
    .max(2000, { message: "Mensagem muito longa (máximo 2000 caracteres)" })
    .transform(val => val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''))
    .transform(val => val.replace(/javascript:/gi, ''))
    .transform(val => val.replace(/on\w+\s*=/gi, ''))
});

interface ActionData {
  type: 'event_created' | 'client_created' | 'invite_sent' | 'contract_generated' | 'stats_shown' | 'reminder_generated';
  data: any;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  action?: ActionData;
}

const quickActions = [
  { label: 'Listar próximos eventos', action: 'Liste meus próximos eventos', icon: <Calendar className="w-3 h-3" /> },
  { label: 'Criar novo projeto', action: 'Quero criar um novo projeto', icon: <Plus className="w-3 h-3" /> },
  { label: 'Ver meus clientes', action: 'Mostre meus clientes', icon: <Users className="w-3 h-3" /> },
  { label: 'Resumo da semana', action: 'Me dê um resumo dos eventos desta semana', icon: <Sparkles className="w-3 h-3" /> },
];

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const persistMessage = async (role: 'user' | 'assistant', content: string, action?: any) => {
    if (!user) return;

    try {
      await supabase.from('chat_history').insert({
        user_id: user.id,
        role,
        content,
        conversation_id: conversationId,
        metadata: action ? { action } : null
      });
    } catch (error) {
      console.error('Failed to persist message:', error);
    }
  };

  const handleError = (error: any) => {
    let errorMessage = 'Desculpe, tive um problema. Pode tentar novamente?';

    if (error.message?.includes('auth') || error.status === 401) {
      errorMessage = '🔒 Você precisa estar logado para usar o assistente.';
    } else if (error.message?.includes('timeout')) {
      errorMessage = '⏱️ A resposta demorou muito. Tente uma pergunta mais simples.';
    } else if (error.message?.includes('rate limit') || error.status === 429) {
      errorMessage = '🚦 Muitas perguntas seguidas! Aguarde alguns segundos.';
    }

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: errorMessage,
      timestamp: new Date()
    }]);

    toast.error('Erro na comunicação com a IA', { description: errorMessage });
  };

  const renderActionCard = (action: ActionData) => {
    if (action.type === 'event_created') {
      return (
        <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-sm">
          <div className="flex items-center gap-2 mb-2 text-[#00e5ff]">
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Novo Evento</span>
          </div>
          <div className="text-xs text-white/80 space-y-1 font-mono">
            <p><span className="text-white/40">Título:</span> {action.data.title}</p>
            <p><span className="text-white/40">Data:</span> {new Date(action.data.start_time).toLocaleDateString()}</p>
            <p><span className="text-white/40">Hora:</span> {new Date(action.data.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      );
    }

    if (action.type === 'client_created') {
      return (
        <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-sm">
          <div className="flex items-center gap-2 mb-2 text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Cliente Criado</span>
          </div>
          <div className="text-xs text-white/80 space-y-1 font-mono">
            <p><span className="text-white/40">Nome:</span> {action.data.full_name}</p>
            <p><span className="text-white/40">Email:</span> {action.data.email}</p>
          </div>
        </div>
      )
    }

    if (action.type === 'invite_sent') {
      return (
        <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-sm">
          <div className="flex items-center gap-2 mb-2 text-purple-400">
            <Send className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Convite Enviado</span>
          </div>
          <div className="text-xs text-white/80 space-y-1 font-mono">
            <p><span className="text-white/40">Para:</span> {action.data.email}</p>
            <a href={action.data.link} target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] hover:underline flex items-center gap-1 mt-1">
              Link de acesso <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )
    }

    if (action.type === 'contract_generated') {
      return (
        <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-sm">
          <div className="flex items-center gap-2 mb-2 text-yellow-400">
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Contrato Gerado</span>
          </div>
          <div className="text-xs text-white/80 space-y-1 font-mono">
            <p><span className="text-white/40">Projeto:</span> {action.data.title}</p>
            <p className="text-white/40 italic">Salvo em Rascunhos</p>
          </div>
        </div>
      )
    }

    if (action.type === 'stats_shown') {
      return (
        <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-sm">
          <div className="flex items-center gap-2 mb-2 text-blue-400">
            <BarChart3 className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Estatísticas</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-black/40 p-2 border border-white/5">
              <span className="text-white/40 block text-[9px] uppercase">Projetos</span>
              <span className="text-white text-lg">{action.data.count}</span>
            </div>
            <div className="bg-black/40 p-2 border border-white/5">
              <span className="text-white/40 block text-[9px] uppercase">Faturamento</span>
              <span className="text-[#00e5ff] text-lg">R$ {action.data.revenue}</span>
            </div>
          </div>
        </div>
      )
    }

    if (action.type === 'reminder_generated') {
      return (
        <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-sm">
          <div className="flex items-center gap-2 mb-2 text-green-400">
            <Send className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp Link</span>
          </div>
          <div className="text-xs text-white/80 space-y-1 font-mono">
            <p className="mb-2">Lembrete para {action.data.client_name} criado.</p>
            <Button size="sm" variant="outline" className="w-full text-xs h-8 border-green-500/50 text-green-400 hover:text-green-300 hover:bg-green-950" asChild>
              <a href={action.data.link} target="_blank" rel="noopener noreferrer">
                Enviar no WhatsApp <ExternalLink className="w-3 h-3 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      )
    }
  };

  const sendMessage = async (customMessage?: string) => {
    const messageContent = customMessage || input;
    const validationResult = messageSchema.safeParse({ content: messageContent });

    if (!validationResult.success) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `ERROR: ${validationResult.error.errors[0].message.toUpperCase()}`
      }]);
      return;
    }

    if (isLoading || !user) return;

    const sanitizedContent = validationResult.data.content;

    // Create optimistic user message
    const userMessage: Message = { role: 'user', content: sanitizedContent, timestamp: new Date() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    // Persist user message asynchronously
    persistMessage('user', sanitizedContent);

    try {
      // Fetch User AI Settings for BYOK
      const { data: aiSettings } = await supabase
        .from('user_ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const headers: Record<string, string> = {};
      if (aiSettings?.api_key) {
        headers['x-ai-provider'] = aiSettings.provider;
        headers['x-ai-key'] = aiSettings.api_key;
        if (aiSettings.model_name) {
          headers['x-ai-model'] = aiSettings.model_name;
        }
      }

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          user_id: user.id,
          conversation_id: conversationId
        },
        headers
      });

      if (error) throw error;

      if (!data?.reply) {
        throw new Error('Resposta vazia da IA');
      }

      const aiContent = data.reply;
      const actionData = data.action;

      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        action: actionData
      }]);

      // Persist assistant message asynchronously
      persistMessage('assistant', aiContent, actionData);

    } catch (error) {
      console.error('Lumi IA Error:', error);
      handleError(error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-none bg-black hover:bg-white text-white hover:text-black border border-white transition-all duration-0"
            >
              <Terminal className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] rounded-none border border-white bg-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] flex flex-col overflow-hidden font-mono"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white bg-black select-none">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-white animate-pulse" />
                <h3 className="font-mono text-xs text-white uppercase tracking-widest">
                  KONTROL_CORE // V.2.0
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-auto px-2 py-1 text-[10px] text-white hover:bg-white hover:text-black rounded-none border border-transparent hover:border-transparent transition-colors duration-0 uppercase tracking-widest"
              >
                [ CLOSE ]
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-black" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <Terminal className="h-12 w-12 text-white mb-6 stroke-[1] opacity-50" />
                  <p className="font-mono text-xs text-white uppercase tracking-widest mb-1">
                    SYSTEM_READY
                  </p>
                  <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest mb-8">
                    INITIALIZE_INPUT...
                  </p>

                  <div className="grid grid-cols-1 w-full gap-2">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(action.action)}
                        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 hover:border-white/30 transition-all text-left group w-full"
                      >
                        <div className="text-white/70 group-hover:text-[#00e5ff] transition-colors">{action.icon}</div>
                        <span className="text-[10px] text-white/70 group-hover:text-white uppercase tracking-wider font-mono">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex flex-col gap-1",
                        message.role === 'user' ? 'items-end' : 'items-start'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-white/40">
                          {message.role === 'user' ? '[USR]' : '[KONTROL]'}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-none px-4 py-3 text-xs font-mono leading-relaxed border",
                          message.role === 'user'
                            ? 'bg-white text-black border-white ml-auto'
                            : 'bg-black text-white border-white/20 mr-auto'
                        )}
                      >
                        <p className="whitespace-pre-wrap uppercase">{message.content}</p>
                        {message.action && renderActionCard(message.action)}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">[KONTROL]</span>
                      <div className="bg-black border border-white/20 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 text-[#00e5ff] animate-spin" />
                          <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest animate-pulse">
                            PROCESSING_DATA...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-0 border-t border-white/20 bg-black">
              <div className="flex gap-0 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-white/50 pointer-events-none">{">"}</span>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ENTER_COMMAND..."
                  disabled={isLoading}
                  maxLength={2000}
                  className="flex-1 bg-transparent border-none text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none font-mono text-xs h-12 pl-8 uppercase"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="h-12 w-16 shrink-0 bg-transparent text-white hover:bg-white hover:text-black rounded-none border-l border-white/20 transition-colors duration-0"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest">[ -&gt; ]</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}