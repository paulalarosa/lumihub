import { useState, useRef, useEffect } from 'react'
import { Send, Terminal, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  text: string
  sender: 'user' | 'assistant'
  timestamp: Date
}

export default function AIAssistantFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'KONTROL_ASSISTANT ONLINE. INITIALIZE_QUERY?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    setTimeout(() => {
      const responses = [
        'QUERY_RECEIVED. PLEASE_CONTACT_SUPPORT_VIA_WHATSAPP.',
        'ACCESSING_KNOWLEDGE_BASE... REDIRECTING_TO_CONCIERGE.',
        'COMMAND_NOT_RECOGNIZED. HUM_INTERVENTION_REQUIRED.',
        'PROTOCOL_INITIATED. CONNECTING_TO_AGENT.',
      ]

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 800)
  }

  const handleWhatsAppFallback = () => {
    window.open('https://wa.me/5521983604870', '_blank')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 w-80 h-96 bg-black rounded-none shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] border border-white flex flex-col overflow-hidden"
          >
            {}
            <div className="bg-black border-b border-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white animate-pulse" />
                <h3 className="text-xs text-white uppercase tracking-widest">
                  KONTROL_PUBLIC_TERMINAL
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:text-black transition-colors px-1"
              >
                <div className="text-[10px] uppercase tracking-widest">[X]</div>
              </button>
            </div>

            {}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[8px] text-white/40 uppercase tracking-widest mb-1">
                    {message.sender === 'user' ? '[GUEST]' : '[SYSTEM]'}
                  </span>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-none text-xs border ${
                      message.sender === 'user'
                        ? 'bg-white text-black border-white'
                        : 'bg-black text-white border-white/20'
                    }`}
                  >
                    <p className="uppercase leading-relaxed">{message.text}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="text-[10px] text-white/50 uppercase tracking-widest animate-pulse"></div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {}
            <div className="p-0 border-t border-white/20">
              <button
                onClick={handleWhatsAppFallback}
                className="w-full py-3 bg-white hover:bg-white/90 text-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border-b border-white/20"
              >
                <MessageSquare className="h-3 w-3" />
                INITIATE_WHATSAPP_UPLINK
              </button>
            </div>

            {}
            <form onSubmit={handleSendMessage} className="bg-black">
              <div className="flex gap-0 border-t border-white/20">
                <span className="flex items-center pl-3 text-white font-mono text-xs select-none">
                  {'>'}
                </span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="INSERIR_DADOS..."
                  className="flex-1 bg-transparent border-none py-3 px-2 outline-none text-xs text-white placeholder-white/30 uppercase font-mono"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="text-white hover:bg-white hover:text-black disabled:opacity-50 transition-colors px-3 border-l border-white/20"
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="h-14 w-14 bg-black text-white border border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] flex items-center justify-center group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90 }}
              animate={{ rotate: 0 }}
              exit={{ rotate: 90 }}
            >
              <span className="font-mono text-xl font-bold">X</span>
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90 }}
              animate={{ rotate: 0 }}
              exit={{ rotate: -90 }}
            >
              <Terminal className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
