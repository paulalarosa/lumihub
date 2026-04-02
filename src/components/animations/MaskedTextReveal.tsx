import { motion } from 'framer-motion'

interface MaskedTextRevealProps {
  text: string
  className?: string
  delay?: number
}

export const MaskedTextReveal = ({
  text,
  className,
  delay = 0,
}: MaskedTextRevealProps) => {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: '0%' }}
        transition={{
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1],
          delay: delay,
        }}
        className={className}
      >
        {text}
      </motion.div>
    </div>
  )
}
