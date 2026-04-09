import { motion } from 'framer-motion'

export const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black md:hidden">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <div className="w-16 h-16 border border-white/20 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
          <span className="text-3xl font-serif font-bold text-white relative z-10">
            K
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-32 h-[1px] bg-white/20 overflow-hidden relative">
            <motion.div
              className="absolute inset-y-0 left-0 bg-white"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                repeatType: 'reverse',
              }}
              className="text-white text-[10px] tracking-[0.2em] font-mono uppercase"
            >
              KHAOS_KONTROL...
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
