import { motion } from 'framer-motion'

export const PricingHeader = ({
  billingCycle,
  setBillingCycle,
}: {
  billingCycle: 'monthly' | 'annual'
  setBillingCycle: (cycle: 'monthly' | 'annual') => void
}) => {
  return (
    <section className="pt-32 pb-12 px-6 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10 text-center">
        <motion.h1
          className="text-6xl md:text-9xl font-bold text-white mb-12 tracking-tighter"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          PLANOS
        </motion.h1>

        {/* Billing Toggle - GLASSMORPHISM */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-2xl shadow-2xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Anual
              <span className="px-2 py-1 bg-green-500 text-white text-[10px] rounded-full uppercase tracking-tighter">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
