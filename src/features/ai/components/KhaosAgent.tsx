import React, { useRef } from 'react'
import { useKhaosAgent } from '../hooks/use-khaos-agent'
import { ChatContainer } from '@/components/infsh/agent/chat-container'
import { MessageBubble } from '@/components/infsh/agent/message-bubble'
import { MessageContent } from '@/components/infsh/agent/message-content'
import { MessageReasoning } from '@/components/infsh/agent/message-reasoning'
import { ToolInvocation } from '@/components/infsh/agent/tool-invocation'
import type { ChatMessageDTO } from '@inferencesh/sdk'
import { cn } from '@/lib/utils'
import { Bot, Sparkles, Shield, User, CornerDownLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Canvas } from './Canvas'

export function KhaosAgent() {
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isGenerating,
    artifact,
    closeArtifact,
    localProgress,
  } = useKhaosAgent()
  const formRef = useRef<HTMLFormElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const PROMPT_STARTERS = [
    {
      label: 'Ver Agenda',
      icon: <Sparkles className="h-3 w-3" />,
      prompt: 'Como está minha agenda para hoje?',
    },
    {
      label: 'Criar Lead',
      icon: <User className="h-3 w-3" />,
      prompt: 'Quero criar um novo lead para um casamento.',
    },
    {
      label: 'Resumo Financeiro',
      icon: <Shield className="h-3 w-3" />,
      prompt: 'Me dê um resumo do meu faturamento deste mês.',
    },
  ]

  return (
    <div className="flex flex-row h-full bg-black text-white overflow-hidden border-l border-white/5 relative">
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {}
        <div className="p-4 border-b border-white/5 bg-zinc-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 bg-white/5 border border-white/10 flex items-center justify-center rounded-none rotate-45">
                <Bot className="h-5 w-5 text-white -rotate-45" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 border-2 border-black rounded-full" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-[11px] font-mono tracking-[0.2em] text-white uppercase font-bold">
                Khaos Assistant
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
                  {localProgress ? 'Loading weights...' : 'Core active'}
                </span>
                <div className="h-1 w-1 bg-emerald-500/50 rounded-full" />
                <span className="text-[9px] font-mono text-emerald-500/50 uppercase">
                  v3.1.2
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {localProgress && localProgress.progress < 1 && (
              <div className="mr-4 w-32 flex flex-col gap-1">
                <div className="h-1 bg-white/10 w-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${localProgress.progress * 100}%` }}
                  />
                </div>
                <span className="text-[7px] font-mono uppercase text-zinc-500 tracking-tighter truncate">
                  {localProgress.text}
                </span>
              </div>
            )}
            <div className="px-2 py-0.5 border border-blue-500/20 bg-blue-500/5 flex items-center gap-1.5 rounded-none">
              <Shield className="h-2.5 w-2.5 text-blue-400" />
              <span className="text-[8px] font-mono text-blue-300 uppercase tracking-tighter">
                Encrypted
              </span>
            </div>
          </div>
        </div>

        {}
        <ChatContainer className="flex-1 min-h-0 bg-transparent relative">
          <div
            className="flex flex-col flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar scroll-smooth"
            ref={scrollRef}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-8">
                <div className="flex flex-col items-center space-y-4 opacity-20 grayscale">
                  <Bot className="h-16 w-16 text-white" />
                  <div className="space-y-1 text-center">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold">
                      Standby Mode
                    </p>
                    <p className="text-[9px] font-mono uppercase tracking-widest">
                      Protocolo de Assistência Híbrida Ativo
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 w-full max-w-sm px-4">
                  {PROMPT_STARTERS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(s.prompt)

                        setTimeout(() => formRef.current?.requestSubmit(), 100)
                      }}
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
            )}

            {messages.map((m: ChatMessageDTO & { reasoning?: string }) => (
              <MessageBubble key={m.id} message={m} className="max-w-full">
                <div className="flex gap-4 w-full group">
                  <div className="shrink-0 mt-1">
                    {m.role === 'user' ? (
                      <div className="h-7 w-7 bg-white/5 border border-white/10 flex items-center justify-center rounded-none">
                        <User className="h-3.5 w-3.5 text-zinc-500" />
                      </div>
                    ) : (
                      <div className="h-7 w-7 bg-white/10 border border-white/20 flex items-center justify-center rounded-none relative">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4 min-w-0">
                    {}
                    {m.reasoning && (
                      <MessageReasoning
                        reasoning={m.reasoning}
                        isReasoning={
                          isGenerating && m === messages[messages.length - 1]
                        }
                      />
                    )}

                    {}
                    <MessageContent
                      message={m}
                      className={cn(
                        'font-sans text-[13px] leading-relaxed',
                        m.role === 'user' ? 'text-zinc-300' : 'text-zinc-200',
                      )}
                    />

                    {}
                    {m.tool_invocations && m.tool_invocations.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {m.tool_invocations.map((ti) => {
                          return <ToolInvocation key={ti.id} invocation={ti} />
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </MessageBubble>
            ))}

            {isGenerating &&
              !(
                messages[messages.length - 1] as unknown as Record<
                  string,
                  unknown
                >
              )?.reasoning && (
                <div className="flex items-center gap-3 opacity-30 px-12">
                  <div className="flex gap-1">
                    <div className="h-1 w-1 bg-white animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1 w-1 bg-white animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1 w-1 bg-white animate-bounce" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em]">
                    Neural Processing
                  </span>
                </div>
              )}
          </div>
        </ChatContainer>

        {}
        <div className="p-6 bg-zinc-950/80 border-t border-white/5 backdrop-blur-md">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="relative group"
          >
            <div className="relative flex flex-col bg-zinc-900/50 border border-white/10 rounded-none focus-within:border-white/30 transition-all duration-300">
              <textarea
                value={input}
                onChange={(e) =>
                  handleInputChange(e as React.ChangeEvent<HTMLTextAreaElement>)
                }
                placeholder="Digite seu comando..."
                className="w-full bg-transparent border-none focus:ring-0 text-[13px] font-sans text-white placeholder:text-zinc-600 resize-none min-h-[50px] max-h-[200px] p-4 custom-scrollbar"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    formRef.current?.requestSubmit()
                  }
                }}
              />

              <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-t border-white/5">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-500">
                      Local_READY
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-20 group-hover:opacity-60 transition-opacity">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-blue-500">
                      Cloud_BYOK
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!input.trim() || isGenerating}
                  size="sm"
                  className="h-7 px-4 bg-white text-black text-[10px] font-mono uppercase tracking-widest hover:bg-zinc-200 disabled:opacity-30 rounded-none group/btn"
                >
                  <span>Execute</span>
                  <CornerDownLeft className="h-3 w-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            <p className="mt-3 text-[8px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="h-2.5 w-2.5" />
              powered by KhaosKontrol hybrid protocol v3
            </p>
          </form>
        </div>
      </div>

      {}
      {artifact && (
        <Canvas
          isOpen={artifact.isOpen}
          onClose={closeArtifact}
          title={artifact.title}
          content={artifact.content}
          type={artifact.type}
        />
      )}
    </div>
  )
}
