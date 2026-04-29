import { ReactNode, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface TiltCardProps {
  children: ReactNode
  /** Intensidade do tilt em graus. Default 6. */
  intensity?: number
  /** Glow follower segue o mouse pelo card. Default true. */
  glow?: boolean
  className?: string
}

/**
 * Card que rotaciona sutilmente em 3D conforme a posição do mouse, com glow
 * white seguindo o cursor. Spring physics dá movimento orgânico, sem aquela
 * sensação travada de transform direto.
 *
 * Usa transform-style: preserve-3d + perspective no parent + GPU-accelerated
 * transforms — zero layout thrash.
 */
export function TiltCard({
  children,
  intensity = 6,
  glow = true,
  className = '',
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 200,
    damping: 25,
  })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 200,
    damping: 25,
  })

  // Glow follower position (0-100%)
  const glowX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%'])
  const glowY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '1200px',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {glow && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(280px circle at var(--x) var(--y), rgba(255,255,255,0.12), transparent 70%)`,
            mixBlendMode: 'overlay',
            // Quando hover, mostra
            ['--x' as string]: glowX,
            ['--y' as string]: glowY,
          }}
        />
      )}
    </motion.div>
  )
}
