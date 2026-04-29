import { ReactNode, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface MagneticButtonProps {
  children: ReactNode
  /** Intensidade do magnetismo em px. Default 12. */
  strength?: number
  className?: string
  onClick?: () => void
  asChild?: boolean
}

/**
 * Wrapper que faz o conteúdo "ser puxado" suavemente em direção ao cursor
 * quando o mouse aproxima. Spring physics dá retorno orgânico ao centro.
 *
 * Aplicado em CTAs primários eleva sensação de qualidade premium sem ser
 * distraente — efeito sutil, percebido subliminalmente.
 */
export function MagneticButton({
  children,
  strength = 12,
  className = '',
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 300, damping: 20 })
  const springY = useSpring(y, { stiffness: 300, damping: 20 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = e.clientX - rect.left - rect.width / 2
    const cy = e.clientY - rect.top - rect.height / 2
    x.set((cx / rect.width) * strength)
    y.set((cy / rect.height) * strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
