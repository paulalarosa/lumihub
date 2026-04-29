import { motion } from 'framer-motion'

interface BigTextBackdropProps {
  text: string
  /** vw size. Default 28. */
  size?: number
  /** vertical anchor. */
  anchor?: 'top' | 'middle' | 'bottom' | number
  /** opacity 0-1. Default 0.18 — visível e punch. */
  opacity?: number
  italic?: boolean
  /** Aplica blur grande. Default false (mais legível). */
  blurred?: boolean
}

/**
 * Tipografia gigante atrás do conteúdo. Usa text-stroke pra criar outline
 * visível mesmo em opacity baixa, com fill quase ausente — efeito ghost/luz
 * típico de pricing pages premium. Sem blur por default (legibilidade > efeito).
 */
export function BigTextBackdrop({
  text,
  size = 28,
  anchor = 'middle',
  opacity = 0.18,
  italic = true,
  blurred = false,
}: BigTextBackdropProps) {
  const topPosition =
    typeof anchor === 'number'
      ? `${anchor}%`
      : anchor === 'top'
        ? '5%'
        : anchor === 'middle'
          ? '50%'
          : '90%'

  const transform =
    typeof anchor !== 'number' && anchor === 'middle' ? 'translateY(-50%)' : ''

  return (
    <div
      aria-hidden
      className="pointer-events-none select-none absolute inset-x-0 text-center overflow-hidden"
      style={{ top: topPosition, transform, zIndex: 2 }}
    >
      <motion.span
        className={`block font-serif font-black tracking-[-0.04em] leading-[0.85] ${
          italic ? 'italic' : ''
        }`}
        style={{
          fontSize: `${size}vw`,
          // Text-stroke + fill near-transparent: outline-luminoso sem dominar
          color: `rgba(255,255,255,${opacity * 0.25})`,
          WebkitTextStroke: `1.5px rgba(255,255,255,${opacity})`,
          filter: blurred ? 'blur(3px)' : 'none',
        }}
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {text}
      </motion.span>
    </div>
  )
}
