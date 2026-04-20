import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, Sparkles, X, Bot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/integrations/supabase/client'

interface Message {
  id: string
  text: string
  sender: 'user' | 'assistant'
  timestamp: Date
}

const SUGGESTED = [
  'Quais planos vocês têm?',
  'Como funciona o trial?',
  'Tenho equipe, qual plano?',
]

export default function AIAssistantFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Oi! Sou a assistente do Khaos Kontrol. Posso te ajudar a entender planos, features ou tirar dúvidas. Por onde começar?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250)
    }
  }, [isOpen])

  const sendMessage = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    try {
      const payload = nextMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))

      const { data, error } = await supabase.functions.invoke(
        'sales-assistant',
        { body: { messages: payload } },
      )
      if (error) throw error

      const replyText =
        data?.reply?.trim() ||
        'Não consegui processar agora. Quer falar direto no WhatsApp?'

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          text: replyText,
          sender: 'assistant',
          timestamp: new Date(),
        },
      ])
    } catch (_err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          text: 'Estou com um problema de conexão. Tenta novamente ou fala com a gente no WhatsApp.',
          sender: 'assistant',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleWhatsApp = () => {
    window.open('https://wa.me/5521983604870', '_blank', 'noopener')
  }

  const showSuggestions = messages.length <= 1 && !isLoading

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute bottom-20 right-0 w-[22rem] md:w-[26rem] h-[32rem] bg-background border border-border/50 shadow-2xl flex flex-col overflow-hidden rounded-lg"
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-foreground/[0.015]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-foreground/5 border border-border/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-foreground">
                    Assistente Khaos
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    online agora
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
                aria-label="Fechar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap rounded-2xl ${
                      m.sender === 'user'
                        ? 'bg-foreground text-background rounded-br-sm'
                        : 'bg-foreground/[0.04] text-foreground border border-border/40 rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-foreground/[0.04] border border-border/40 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                  </div>
                </div>
              )}

              {showSuggestions && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-border/40 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border/40">
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03] transition-all border-b border-border/30"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                prefiro falar no WhatsApp
              </button>
              <form onSubmit={handleSubmit} className="flex items-center px-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escreva sua pergunta…"
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none outline-none py-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/90 transition-all"
                  aria-label="Enviar"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="h-14 w-14 rounded-full bg-foreground text-background border border-border/40 shadow-xl flex items-center justify-center hover:bg-foreground/90 transition-all"
        aria-label={isOpen ? 'Fechar assistente' : 'Abrir assistente'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Bot className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
