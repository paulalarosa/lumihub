import { motion } from 'framer-motion'

interface BigTextBackdropProps {
  text: string
  /** vw size. Default 22. */
  size?: number
  /** vertical anchor. Default "middle". */
  anchor?: 'top' | 'middle' | 'bottom' | number
  /** opacity 0-1. Default 0.10 — visível no preto puro. */
  opacity?: number
  /** Aplica blur e ghost double-layer pra senso de profundidade. Default true. */
  ghost?: boolean
  /** Italic. Default true. */
  italic?: boolean
}

/**
 * Tipografia gigante atrás do conteúdo. Double-layer com offset cria efeito
 * "ghost" / luminoso. Animação de entrada lenta e respirante.
 */
export function BigTextBackdrop({
  text,
  size = 22,
  anchor = 'middle',
  opacity = 0.1,
  ghost = true,
  italic = true,
}: BigTextBackdropProps) {
  const topPosition =
    typeof anchor === 'number'
      ? `${anchor}%`
      : anchor === 'top'
        ? '8%'
        : anchor === 'middle'
          ? '50%'
          : '92%'

  const transform =
    typeof anchor !== 'number' && anchor === 'middle' ? 'translateY(-50%)' : ''

  return (
    <div
      aria-hidden
      className="pointer-events-none select-none absolute inset-x-0 text-center overflow-hidden"
      style={{
        top: topPosition,
        transform,
        zIndex: 2,
      }}
    >
      <motion.span
        className={`block font-serif font-black tracking-tighter leading-[0.85] ${
          italic ? 'italic' : ''
        }`}
        style={{
          fontSize: `${size}vw`,
          color: `rgba(255,255,255,${opacity})`,
          // Stroke + fill cria efeito outline-luminoso
          WebkitTextStroke: `1px rgba(255,255,255,${opacity * 0.8})`,
          filter: 'blur(2px)',
        }}
        initial={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(2px)' }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {text}
      </motion.span>

      {/* Ghost layer — duplicado com offset cria sensação de luz vazando */}
      {ghost && (
        <motion.span
          className={`absolute inset-x-0 top-0 block font-serif font-black tracking-tighter leading-[0.85] ${
            italic ? 'italic' : ''
          }`}
          style={{
            fontSize: `${size}vw`,
            color: `rgba(255,255,255,${opacity * 0.4})`,
            filter: 'blur(40px)',
            transform: 'translateY(-2%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.3, ease: 'easeOut' }}
        >
          {text}
        </motion.span>
      )}
    </div>
  )
}
