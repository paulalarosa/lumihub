import { motion, Variants } from 'framer-motion'

interface SplitTextProps {
  text: string
  /** Stagger delay entre cada char/word em segundos. Default 0.04. */
  stagger?: number
  /** Delay inicial antes do stagger começar. Default 0. */
  delay?: number
  /** Granularidade da animação. Default 'word'. */
  by?: 'char' | 'word'
  className?: string
  /** Aria-label pra screen readers verem o texto inteiro. */
  ariaLabel?: string
  italic?: boolean
}

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
}

/**
 * Split text em chars/words e anima cada um com stagger. Combinação de fade,
 * lift, e blur cria entrada cinematográfica pro hero/headlines.
 *
 * Acessibilidade: o texto inteiro fica num span com aria-label; os chunks
 * têm aria-hidden pra screen readers não falarem letra a letra.
 */
export function SplitText({
  text,
  stagger = 0.04,
  delay = 0,
  by = 'word',
  className = '',
  ariaLabel,
  italic = false,
}: SplitTextProps) {
  const chunks = by === 'word' ? text.split(' ') : Array.from(text)

  return (
    <span
      role="heading"
      aria-label={ariaLabel ?? text}
      className={`${italic ? 'italic' : ''} ${className}`}
    >
      <motion.span
        className="inline"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: stagger, delayChildren: delay }}
      >
        {chunks.map((chunk, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="inline-block"
            variants={wordVariants}
            style={{ marginRight: by === 'word' ? '0.25em' : 0 }}
          >
            {chunk === ' ' ? ' ' : chunk}
          </motion.span>
        ))}
      </motion.span>
    </span>
  )
}
