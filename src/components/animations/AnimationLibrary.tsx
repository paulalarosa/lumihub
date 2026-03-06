import { motion } from 'framer-motion'
import { ReactNode, useEffect, useState } from 'react'

// 1. FLOATING ANIMATION (Loop suave)
export const FloatingElement = ({
  children,
  delay = 0,
  duration = 3,
}: {
  children: ReactNode
  delay?: number
  duration?: number
}) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{
      y: [-10, 10, -10],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    {children}
  </motion.div>
)

// 2. ROTATING ANIMATION (Loop contínuo)
export const RotatingElement = ({
  children,
  speed = 20,
  reverse = false,
}: {
  children: ReactNode
  speed?: number
  reverse?: boolean
}) => (
  <motion.div
    animate={{
      rotate: reverse ? -360 : 360,
    }}
    transition={{
      duration: speed,
      repeat: Infinity,
      ease: 'linear',
    }}
  >
    {children}
  </motion.div>
)

// 3. PULSING ANIMATION (Loop de escala)
export const PulsingElement = ({
  children,
  scale = 1.05,
  duration = 2,
}: {
  children: ReactNode
  scale?: number
  duration?: number
}) => (
  <motion.div
    animate={{
      scale: [1, scale, 1],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    {children}
  </motion.div>
)

// 4. WAVE ANIMATION (Onda horizontal)
export const WaveElement = ({
  children,
  amplitude = 20,
  duration = 4,
}: {
  children: ReactNode
  amplitude?: number
  duration?: number
}) => (
  <motion.div
    animate={{
      x: [-amplitude, amplitude, -amplitude],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    {children}
  </motion.div>
)

// 5. MORPHING SHAPE (Forma que muda)
export const MorphingBlob = ({
  className = '',
  color = '#8B5CF6',
}: {
  className?: string
  color?: string
}) => (
  <motion.div
    className={className}
    style={{
      background: color,
    }}
    animate={{
      borderRadius: [
        '30% 70% 70% 30% / 30% 30% 70% 70%',
        '70% 30% 30% 70% / 70% 70% 30% 30%',
        '50% 50% 50% 50% / 50% 50% 50% 50%',
        '30% 70% 70% 30% / 30% 30% 70% 70%',
      ],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
)

// 6. PARALLAX SCROLL
export const ParallaxSection = ({
  children,
  speed = 0.5,
}: {
  children: ReactNode
  speed?: number
}) => {
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Usando window.scrollY em vez de pageYOffset (deprecated)
      setOffsetY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.div
      style={{
        transform: `translateY(${offsetY * speed}px)`,
      }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      {children}
    </motion.div>
  )
}

// 7. STAGGER CONTAINER (Animação em cascata)
export const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
}: {
  children: ReactNode
  staggerDelay?: number
}) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={{
      visible: {
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    }}
  >
    {children}
  </motion.div>
)

export const StaggerItem = ({ children }: { children: ReactNode }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }}
    transition={{ duration: 0.6 }}
  >
    {children}
  </motion.div>
)
