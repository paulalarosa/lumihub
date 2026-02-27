import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

export function AssistantUpsellBanner() {
  const fadeUp = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden border border-purple-500/20 bg-gradient-to-r from-[#0A0A0A] via-[#110a18] to-[#1a0f1f] group"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(139,92,246,0.06)_0%,transparent_60%)]" />

      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/15 to-transparent" />

      <div className="relative z-10 p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="shrink-0 mt-0.5">
            <div className="relative">
              <Sparkles
                className="w-5 h-5 text-purple-400/80"
                strokeWidth={1.5}
              />
              <div className="absolute inset-0 blur-md bg-purple-500/20 rounded-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-purple-400/70">
              Upgrade Disponível
            </p>
            <p className="text-sm text-white/80 leading-relaxed max-w-lg">
              Trabalhas com vários profissionais? Centraliza todas as tuas
              agendas num único painel e gere as tuas comissões.
            </p>
          </div>
        </div>

        <a
          href="/upgrade"
          className="shrink-0 flex items-center gap-2.5 px-5 py-2.5
                     bg-purple-500/10 border border-purple-500/25 hover:border-purple-400/40
                     hover:bg-purple-500/15 transition-all duration-300
                     text-[10px] font-mono uppercase tracking-[0.2em] text-purple-300/90
                     hover:text-purple-200 group/btn"
        >
          Ativa a Conta PRO
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform duration-200" />
        </a>
      </div>
    </motion.div>
  )
}
