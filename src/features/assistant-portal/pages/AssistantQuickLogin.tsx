import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Loader2, ShieldCheck, Lock } from 'lucide-react'

interface AssistantSession {
  assistantId: string
  assistantName: string
  professionalId: string
  professionalName: string
}

export default function AssistantQuickLogin() {
  const { professionalId } = useParams<{ professionalId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [pinFocused, setPinFocused] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!professionalId || !pin.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o PIN de acesso.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const { data: rpcData, error } = await supabase.rpc(
        'verify_assistant_login',
        {
          p_professional_id: professionalId,
          p_pin: pin.trim(),
        },
      )

      if (error) throw error

      const data = rpcData as any

      if (!data || data.error) {
        toast({
          title: 'Acesso Negado',
          description: 'PIN incorreto ou sem autorização.',
          variant: 'destructive',
        })
        return
      }

      const assistant = {
        id: data.id,
        full_name: data.full_name,
      }

      const { data: professional } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', professionalId)
        .maybeSingle()

      const session: AssistantSession = {
        assistantId: assistant.id,
        assistantName: assistant.full_name || 'Assistente',
        professionalId,
        professionalName: professional?.full_name || 'Profissional',
      }

      sessionStorage.setItem(
        `assistant_session_${professionalId}`,
        JSON.stringify(session),
      )

      toast({
        title: 'Acesso autorizado',
        description: `Bem-vinda, ${assistant.full_name?.split(' ')[0] || 'Assistente'}.`,
      })

      navigate(`/agenda-equipa/${professionalId}/dashboard`)
    } catch (error) {
      logger.error(error, 'AssistantQuickLogin.handleLogin', {
        showToast: false,
      })
      toast({
        title: 'Erro no sistema',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  }

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-white selection:text-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.015)_0%,transparent_70%)]" />

      <motion.div
        className="w-full max-w-sm relative z-10"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/20" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20" />

        <motion.div variants={fadeUp} className="text-center mb-14 space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <ShieldCheck
                className="w-7 h-7 text-white/80"
                strokeWidth={1.2}
              />
              <div className="absolute inset-0 blur-md bg-white/10 rounded-full" />
            </div>
          </div>
          <div>
            <p className="text-neutral-500 text-[10px] uppercase tracking-[0.4em] mb-2 font-medium">
              Acesso Rápido
            </p>
            <h1 className="text-3xl font-sans font-semibold text-white tracking-tight">
              AGENDA DA ASSISTENTE
            </h1>
          </div>
        </motion.div>

        <form onSubmit={handleLogin} className="space-y-8">
          <motion.div variants={fadeUp} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="assistant-pin"
                className="block text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-mono"
              >
                PIN de Acesso
              </label>
              <div className="relative group">
                <div
                  className={`
                    relative h-14 bg-[#0A0A0A] border transition-all duration-300
                    ${pinFocused ? 'border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.03)]' : 'border-white/10 group-hover:border-white/20'}
                  `}
                >
                  <input
                    id="assistant-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onFocus={() => setPinFocused(true)}
                    onBlur={() => setPinFocused(false)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setPin(val)
                    }}
                    placeholder=""
                    className="absolute inset-0 w-full h-full px-4 text-center text-2xl font-mono tracking-[0.5em]
                               bg-transparent border-none text-white focus:ring-0 focus:outline-none
                               placeholder:text-white/15"
                    autoComplete="off"
                  />

                  {pin.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center gap-4 pointer-events-none">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-white/10 rounded-full"
                        />
                      ))}
                    </div>
                  )}

                  <Lock
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15 pointer-events-none"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full h-14 bg-white text-black hover:bg-neutral-200
                         disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed
                         transition-all duration-300
                         text-xs font-bold uppercase tracking-[0.2em] border border-transparent
                         relative overflow-hidden group"
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4 mx-auto" />
              ) : (
                <>
                  <span className="relative z-10">Aceder à Agenda</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        <motion.div variants={fadeUp} className="mt-14 text-center space-y-3">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-mono">
            Secure Access // Shadow Protocol
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-green-500/50 rounded-full animate-pulse" />
            <span className="text-[9px] text-neutral-700 font-mono uppercase tracking-wider">
              Encrypted Session
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
