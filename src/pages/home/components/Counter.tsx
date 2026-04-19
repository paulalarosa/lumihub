import { useState, useRef, useEffect } from 'react'

export const Counter = ({
  value,
  duration = 2,
}: {
  value: string
  duration?: number
}) => {
  const [count, setCount] = useState(0)
  const countRef = useRef<HTMLSpanElement>(null)
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''))
  const suffix = value.replace(/^[+]?[0-9.]+/, '')

  useEffect(() => {
    let startTimestamp: number | null = null
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min(
        (timestamp - startTimestamp) / (duration * 1000),
        1,
      )
      setCount(progress * numericValue)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          window.requestAnimationFrame(step)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (countRef.current) observer.observe(countRef.current)
    return () => observer.disconnect()
  }, [numericValue, duration])

  return (
    <span ref={countRef}>
      {numericValue % 1 === 0 ? Math.floor(count) : count.toFixed(1)}
      {suffix}
    </span>
  )
}
