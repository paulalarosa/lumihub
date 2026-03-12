import { useState, useEffect } from 'react'

export const usePerformance = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLowEnd, setIsLowEnd] = useState(false)

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setShouldReduceMotion(mediaQuery.matches)

    // Check if mobile
    setIsMobile(window.innerWidth < 768)

    // Check device performance
    const checkPerformance = () => {
      // Check CPU cores (low-end if < 4 cores)
      const cores = navigator.hardwareConcurrency || 2

      // Check memory (low-end if < 4GB)
      const memory =
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4

      setIsLowEnd(cores < 4 || memory < 4)
    }

    checkPerformance()

    const handleResize = () => setIsMobile(window.innerWidth < 768)
    const handleMotionChange = () => setShouldReduceMotion(mediaQuery.matches)

    window.addEventListener('resize', handleResize)
    mediaQuery.addEventListener('change', handleMotionChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      mediaQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  return {
    shouldReduceMotion,
    isMobile,
    isLowEnd,
    canUseHeavyAnimations: !shouldReduceMotion && !isLowEnd,
    canUse3D: !isMobile && !isLowEnd && !shouldReduceMotion,
  }
}
