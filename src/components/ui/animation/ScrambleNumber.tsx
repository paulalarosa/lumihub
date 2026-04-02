import { useEffect, useState, useRef } from 'react'
import { useInView } from 'framer-motion'

interface ScrambleNumberProps {
  value: string | number
  suffix?: string
  className?: string
}

const CHARS = 'X#09AF_!@%&'
const SCRAMBLE_DURATION = 1500
const INTERVAL_MS = 50

export const ScrambleNumber = ({
  value,
  suffix = '',
  className = '',
}: ScrambleNumberProps) => {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-10px' })
  const [displayValue, setDisplayValue] = useState('0')
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (!isInView || isDone) return

    const startTime = Date.now()

    const updateScramble = () => {
      const elapsed = Date.now() - startTime

      if (elapsed >= SCRAMBLE_DURATION) {
        setDisplayValue(String(value))
        setIsDone(true)
        clearInterval(intervalId)
      } else {
        const valStr = String(value)
        let scrambled = ''
        for (let i = 0; i < valStr.length; i++) {
          scrambled += CHARS[Math.floor(Math.random() * CHARS.length)]
        }
        setDisplayValue(scrambled)
      }
    }

    const intervalId = setInterval(updateScramble, INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [isInView, value, isDone])

  useEffect(() => {}, [value])

  return (
    <span ref={ref} className={`font-mono ${className}`}>
      {displayValue}
      {suffix}
    </span>
  )
}
