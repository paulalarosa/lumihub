import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Send,
  Loader2,
  Terminal,
  ChevronRight
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
        return `SYSTEM_QUERY_RESULT: ${count || 0} CLIENT_RECORDS_FOUND.`;
      } catch (err) {
        console.error('Error counting clients:', err);
        return 'ERROR: UNABLE_TO_ACCESS_DATABASE.';
      }
    }

    if (lowerContent.includes('ola') || lowerContent.includes('olá') || lowerContent.includes('oi')) {
      return 'LUMI_OS_V2.0 ONLINE. AWAITING_COMMAND.';
    }

    // Default response
    return "COMMAND_RECEIVED. PROCESSING... [DEMO_MODE]. TRY: 'QUANTOS CLIENTES EU TENHO?'";
  };

  const sendMessage = async () => {
    const validationResult = messageSchema.safeParse({ content: input });

    if (!validationResult.success) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `ERROR: ${validationResult.error.errors[0].message.toUpperCase()}`
      }]);
      return;
    }

    if (isLoading || !user) return;

    const sanitizedContent = validationResult.data.content;

    const userMessage: Message = { role: 'user', content: sanitizedContent };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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
                  LUMI_CORE // V.2.0
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
                <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
                  <Terminal className="h-12 w-12 text-white mb-6 stroke-[1]" />
                  <p className="font-mono text-xs text-white uppercase tracking-widest mb-2">
                    SYSTEM_READY
                  </p>
                  <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
                    INITIALIZE_INPUT...
                  </p>
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
                          {message.role === 'user' ? '[USR]' : '[LUMI]'}
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
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex flex-col items-start gap-1 p-2">
                      <span className="font-mono text-[10px] text-white/50 bg-black uppercase tracking-widest animate-pulse">
                         /// PROCESSING_DATA...
                      </span>
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
                  onClick={sendMessage}
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