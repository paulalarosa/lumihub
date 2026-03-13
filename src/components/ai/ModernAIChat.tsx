import { useState, useRef, useEffect } from 'react'
import { useChatHistory } from '@/features/ai/hooks/useChatHistory'
import { useAIStore } from '@/stores/useAIStore'
import { Bot, X, Settings, CornerDownLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AISettingsModal } from './settings/AISettingsModal'

export const ModernAIChat = ({
  conversationId: propId,
}: {
  conversationId?: string
}) => {
  const { isChatOpen, toggleChat, currentConversationId } = useAIStore()
  const activeId = propId || currentConversationId || undefined

  // Fallback/Default handling could be done in hook or store, but generic ID helps query.
  // If no ID, hook enabled=false.

  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const { data: messages, sendMessage } = useChatHistory(activeId)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sendMessage.isPending, isChatOpen])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputValue.trim() || sendMessage.isPending) return

    const content = inputValue
    setInputValue('')
    await sendMessage.mutateAsync(content)
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={toggleChat}
        className={cn(
          'fixed bottom-6 right-6 w-14 h-14 bg-black border-2 border-white/20 hover:border-white transition-all z-50 rounded-none overflow-hidden group',
          isChatOpen && 'rotate-90 opacity-0 pointer-events-none',
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent group-hover:bg-white/10 transition-colors" />
        <Bot className="w-6 h-6 text-white relative z-10 m-auto" />
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500/50 animate-pulse" />
      </button>

      {/* Main Chat Panel */}
      <div
        className={cn(
          'fixed bottom-6 right-6 w-full max-w-[450px] h-[700px] bg-black border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] z-50 flex flex-col transition-all duration-500 transform rounded-none overflow-hidden',
          isChatOpen
            ? 'translate-y-0 opacity-100'
            : 'translate-y-12 opacity-0 pointer-events-none',
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-zinc-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-white/5 border border-white/10 flex items-center justify-center rounded-none rotate-45">
              <Bot className="h-5 w-5 text-white -rotate-45" />
            </div>
            <div>
              <h3 className="text-[11px] font-mono tracking-[0.2em] text-white uppercase font-bold">
                Khaos Protocol
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
                  Stream Active
                </span>
                <div className="h-1 w-1 bg-emerald-500/50 rounded-full" />
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
            <button
              onClick={toggleChat}
              className="p-2 hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
        >
          <AnimatePresence>
            {messages?.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-none border ${
                    msg.role === 'user'
                      ? 'bg-zinc-900 border-white/10 text-zinc-100'
                      : 'bg-black border-white/5 text-zinc-300'
                  }`}
                >
                  <div className="text-[13px] leading-relaxed whitespace-pre-wrap font-mono">
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sendMessage.isPending && (
            <div className="flex items-center gap-3 opacity-30 p-2">
              <div className="flex gap-1">
                <div className="h-1 w-1 bg-white animate-bounce [animation-delay:-0.3s]" />
                <div className="h-1 w-1 bg-white animate-bounce [animation-delay:-0.15s]" />
                <div className="h-1 w-1 bg-white animate-bounce" />
              </div>
              <span className="text-[8px] font-mono uppercase tracking-[0.2em]">
                Khaos is typing...
              </span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-zinc-950/80 border-t border-white/5 backdrop-blur-md">
          <form onSubmit={handleSend} className="relative group">
            <div className="relative flex flex-col bg-zinc-900/50 border border-white/10 rounded-none focus-within:border-white/30 transition-all duration-300">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digital signature required..."
                disabled={sendMessage.isPending}
                className="bg-transparent border-none focus-visible:ring-0 text-[13px] font-mono text-white placeholder:text-zinc-600 h-14 px-4"
              />
              <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-t border-white/5">
                <div className="flex items-center gap-1.5 opacity-40">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">
                    System_Encrypted
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={!inputValue.trim() || sendMessage.isPending}
                  size="sm"
                  className="h-7 px-4 bg-white text-black text-[10px] font-mono uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-30 rounded-none"
                >
                  <span>Execute</span>
                  <CornerDownLeft className="h-3 w-3 ml-2" />
                </Button>
              </div>
            </div>
            <p className="mt-3 text-[7px] font-mono text-zinc-700 uppercase tracking-widest text-center">
              Khaos Kontrol Enterprise AI Protocol v4.0.1
            </p>
          </form>
        </div>
      </div>

      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  )
}
