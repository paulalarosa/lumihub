import { useEffect, useState } from 'react'

interface ScrambleNumberProps {
  value: number
  duration?: number
  className?: string
  suffix?: string
}

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+'

export const ScrambleNumber = ({
  value,
  duration = 2,
  className,
  suffix = '',
}: ScrambleNumberProps) => {
  const [displayValue, setDisplayValue] = useState('0')
  const [_isHovered, _setIsHovered] = useState(false)

  useEffect(() => {
    let startTime: number
    let animationFrameId: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = (timestamp - startTime) / (duration * 1000)

      if (progress < 1) {
        // Scramble phase
        setDisplayValue(
          Math.floor(Math.random() * 100).toString() +
            CHARS[Math.floor(Math.random() * CHARS.length)],
        )
        animationFrameId = requestAnimationFrame(animate)
      } else {
        // Final value
        setDisplayValue(value.toString())
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [value, duration])

  // Re-scramble on hover? Maybe just a glitch effect. Use simple scramble for now.

  return (
    <span className={className}>
      {displayValue}
      {suffix}
    </span>
  )
}
