import { useEffect, useState } from 'react'
import { useMotionValue, useTransform, MotionValue } from 'framer-motion'

export const useScroll = () => {
  const scrollY = useMotionValue(0)
  const [isScrolling, setIsScrolling] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      scrollY.set(window.scrollY)
      setIsScrolling(true)

      setTimeout(() => setIsScrolling(false), 150)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollY])

  return { scrollY, isScrolling }
}

export const useParallax = (
  scrollY: MotionValue<number>,
  range: [number, number],
  offset: [number, number],
) => {
  return useTransform(scrollY, range, offset)
}
