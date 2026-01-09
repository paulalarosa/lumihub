import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export default function AIAssistantFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou o assistente de IA da Lumi. Como posso ajudar você hoje?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const responses = [
        'Essa é uma ótima pergunta! Para mais detalhes, fale com nosso time via WhatsApp 📱',
        'Entendo perfeitamente. Você pode explorar mais em nossos planos ou agendar uma call com a concierge.',
        'Excelente! Recomendo que você veja nossa documentação completa ou entre em contato direto.',
        'Ótimo! Para questões mais complexas, nossa equipe está disponível no WhatsApp para uma conversa personalizada.',
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  const handleWhatsAppFallback = () => {
    window.open('https://wa.me/5521983604870', '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute bottom-20 right-0 w-80 h-96 bg-[#FAFAFA] rounded-2xl shadow-2xl border border-[#E5E7EB] flex flex-col overflow-hidden"
            style={{
              boxShadow:
                '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#050505] to-[#374151] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-semibold">Lumi Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-[#E5E7EB] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAFA]">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-[#050505] text-white'
                        : 'bg-[#E5E7EB] text-[#050505]'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#E5E7EB] px-4 py-2 rounded-lg">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-[#374151] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#374151] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#374151] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp Fallback Button */}
            <div className="px-4 py-2 border-t border-[#E5E7EB]">
              <button
                onClick={handleWhatsAppFallback}
                className="w-full py-2 px-3 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#20BA5A] transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Falar no WhatsApp
              </button>
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="border-t border-[#E5E7EB] p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Sua pergunta..."
                  className="flex-1 bg-transparent border-0 border-b border-[#E5E7EB] py-2 px-0 outline-none text-sm text-[#050505] placeholder-[#9CA3AF]"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="text-[#050505] hover:text-[#374151] disabled:opacity-50 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative h-16 w-16 rounded-full bg-gradient-to-br from-[#050505] to-[#374151] text-white shadow-lg flex items-center justify-center group overflow-hidden"
      >
        {/* Glassmorphism effect */}
        <div
          className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity"
          style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        />

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
              <X className="h-6 w-6 relative z-10" />
            </motion.div>
          ) : (
            <motion.div key="sparkles" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
              <Sparkles className="h-6 w-6 relative z-10" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing glow when closed */}
        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-[#050505] opacity-0"
          />
        )}
      </motion.button>
    </div>
  );
}
