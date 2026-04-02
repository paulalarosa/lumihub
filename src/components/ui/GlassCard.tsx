import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: ReactNode
  hover?: boolean
  glow?: boolean
  className?: string
}

export const GlassCard = ({
  children,
  hover = true,
  glow = false,
  className,
  ...props
}: GlassCardProps) => {
  return (
    <motion.div
      className={cn(
        'relative p-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl',
        hover && 'hover:bg-white/[0.05] hover:border-white/20 transition-all',
        glow && 'shadow-2xl shadow-purple-500/10',
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      {...props}
    >
      {}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />

      {}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
