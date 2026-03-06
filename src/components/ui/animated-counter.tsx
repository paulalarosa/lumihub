import { useRef, useEffect } from 'react'
import { useInView, animate } from 'framer-motion'

export const AnimatedCounter = ({
  value,
  suffix,
}: {
  value: number
  suffix: string
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (isInView && ref.current) {
      animate(0, value, {
        duration: 2,
        onUpdate: (cv) => {
          if (ref.current) ref.current.textContent = Math.round(cv).toString()
        },
      })
    }
  }, [isInView, value])

  return (
    <>
      <span ref={ref}>0</span>
      {suffix}
    </>
  )
}
