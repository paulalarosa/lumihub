import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { logger } from '@/services/logger'

interface CountUpProps {
  from?: number
  to: number
  duration?: number
  suffix?: string
  decimals?: number
  format?: (value: number) => string
}

/**
 * Safe CountUp Component with error handling
 * Uses frame-by-frame animation instead of motion values for stability
 */
export const CountUp = ({
  from = 0,
  to = 0,
  duration = 2.5,
  suffix = '',
  decimals = 0,
  format,
}: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [displayValue, setDisplayValue] = useState<string | number>(from ?? 0)

  useEffect(() => {
    if (!isInView) return

    try {
      // Validate inputs
      const validTo = typeof to === 'number' && !isNaN(to) ? to : 0
      const validFrom = typeof from === 'number' && !isNaN(from) ? from : 0
      const validDuration =
        typeof duration === 'number' && duration > 0 ? duration : 2.5

      const frameCount = Math.ceil(validDuration * 60)
      let currentFrame = 0
      let animationId: NodeJS.Timeout | null = null

      const animate = () => {
        currentFrame++
        const progress = Math.min(currentFrame / frameCount, 1)
        // easeOut cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        const current = validFrom + (validTo - validFrom) * easeProgress

        let formatted: string | number = current

        if (format && typeof format === 'function') {
          try {
            formatted = format(current)
          } catch {
            formatted = Math.round(current)
          }
        } else if (decimals > 0) {
          formatted = parseFloat(current.toFixed(decimals))
        } else {
          formatted = Math.round(current)
        }

        setDisplayValue(formatted)

        if (progress < 1) {
          animationId = setTimeout(animate, 1000 / 60)
        }
      }

      animationId = setTimeout(animate, 0)

      return () => {
        if (animationId) clearTimeout(animationId)
      }
    } catch (error) {
      logger.error(error, { message: 'Erro na animação.', showToast: false })
      // Fallback: show final value
      setDisplayValue(to ?? 0)
    }
  }, [isInView, from, to, duration, decimals, format])

  return (
    <span ref={ref} className="inline-block">
      {displayValue}
      {suffix}
    </span>
  )
}
