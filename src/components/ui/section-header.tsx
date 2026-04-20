import { motion } from 'framer-motion'

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  centered?: boolean
}

export const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  centered = false,
}: SectionHeaderProps) => {
  return (
    <div className="flex flex-col items-start text-left w-full">
      {eyebrow && (
        <motion.p
          className="text-white/40 text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-widest mb-4 font-mono select-none"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {eyebrow}
        </motion.p>
      )}

      <motion.h2
        className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight font-serif select-none"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          className={`text-white/60 text-base md:text-lg lg:text-xl font-light leading-relaxed select-none ${centered ? 'mx-auto' : 'max-w-2xl'}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}
