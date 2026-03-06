import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedTextRevealProps {
  text: string
  className?: string
  delay?: number
}

export const AnimatedTextReveal = ({
  text,
  className = '',
  delay = 0,
}: AnimatedTextRevealProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const words = text.split(' ')

  return (
    <div className={className}>
      {words.map((word, wordIndex) => (
        <span
          key={wordIndex}
          className="inline-block overflow-hidden mr-[0.25em]"
        >
          <motion.span
            className="inline-block"
            initial={{ y: '100%', opacity: 0 }}
            animate={isVisible ? { y: 0, opacity: 1 } : {}}
            transition={{
              duration: 0.8,
              delay: delay + wordIndex * 0.1,
              ease: [0.33, 1, 0.68, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </div>
  )
}
