import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  X,
  Send,
  Loader2,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';

// Input validation schema
const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: "Mensagem não pode estar vazia" })
    .max(2000, { message: "Mensagem muito longa (máximo 2000 caracteres)" })
    // Sanitize potentially dangerous patterns
    .transform(val => val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''))
    .transform(val => val.replace(/javascript:/gi, ''))
    .transform(val => val.replace(/on\w+\s*=/gi, ''))
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
  }, [messages]);

  const processMessage = async (content: string) => {
    const lowerContent = content.toLowerCase();

    // Mock RAG / Context Awareness Logic
    if (lowerContent.includes('clientes') && (lowerContent.includes('quantos') || lowerContent.includes('total') || lowerContent.includes('tenho'))) {
      try {
        const { count, error } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;
        return `Você tem ${count || 0} clientes cadastrados atualmente no sistema.`;
      } catch (err) {
        console.error('Error counting clients:', err);
        return 'Desculpe, não consegui acessar o número de clientes no momento.';
      }
    }

    if (lowerContent.includes('ola') || lowerContent.includes('olá') || lowerContent.includes('oi')) {
      return 'Olá! Sou a Lumi, sua assistente virtual. Como posso ajudar com sua gestão hoje?';
    }

    // Default response
    return "Entendi. No momento, minha conexão com o cérebro principal está em modo de demonstração. Posso ajudar consultando seus clientes ou agenda se você for específico (ex: 'Quantos clientes eu tenho?').";
  };

  const sendMessage = async () => {
    // Validate and sanitize input
    const validationResult = messageSchema.safeParse({ content: input });

    if (!validationResult.success) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: validationResult.error.errors[0].message
      }]);
      return;
    }

    if (isLoading || !user) return;

    const sanitizedContent = validationResult.data.content;

    const userMessage: Message = { role: 'user', content: sanitizedContent };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate network delay for realism
    setTimeout(async () => {
      const reply = await processMessage(sanitizedContent);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply
      }]);
      setIsLoading(false);
    }, 1000);
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
      {/* Floating Button */}
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
              className="h-14 w-14 rounded-full bg-[#00e5ff] hover:bg-[#00e5ff]/80 text-black shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all hover:scale-105"
            >
              <Sparkles className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] rounded-2xl border border-white/10 bg-[#050505]/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#00e5ff]/20 flex items-center justify-center border border-[#00e5ff]/30">
                  <Bot className="h-4 w-4 text-[#00e5ff]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Lumi AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
                    <p className="text-[10px] text-white/50 uppercase tracking-wider">Online</p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-[#00e5ff]/5 flex items-center justify-center mb-4 border border-[#00e5ff]/20">
                    <MessageCircle className="h-8 w-8 text-[#00e5ff]" />
                  </div>
                  <h4 className="font-serif text-lg font-light text-white mb-2">
                    Como posso ajudar?
                  </h4>
                  <p className="text-sm text-white/40 mb-6 font-light">
                    Pergunte-me sobre seus clientes, agenda ou projetos.
                  </p>
                  <div className="space-y-2 w-full">
                    {[
                      "Quantos clientes eu tenho?",
                      "Tenho eventos hoje?",
                      "Resumir minha semana"
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(suggestion);
                          inputRef.current?.focus();
                        }}
                        className="w-full text-left text-sm p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-white/70"
                      >
                        "{suggestion}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          message.role === 'user'
                            ? 'bg-white/10 text-white rounded-br-sm'
                            : 'bg-black/40 border border-[#00e5ff]/30 text-white/90 rounded-bl-sm shadow-[0_0_15px_rgba(0,229,255,0.05)]'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-black/40 border border-[#00e5ff]/20 rounded-2xl rounded-bl-sm px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-[#00e5ff]" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-black/20">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  disabled={isLoading}
                  maxLength={2000}
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#00e5ff]/50 rounded-xl"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="shrink-0 bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}