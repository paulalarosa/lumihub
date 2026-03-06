import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverProps {
  threshold?: number | number[]
  rootMargin?: string
  freezeOnceVisible?: boolean
}

export const useIntersectionObserver = ({
  threshold = 0,
  rootMargin = '0px',
  freezeOnceVisible = false,
}: UseIntersectionObserverProps = {}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Se já foi visível e deve congelar, não fazer nada
    if (freezeOnceVisible && hasBeenVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting
        setIsVisible(visible)

        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true)
        }

        // Se deve congelar uma vez visível, desconectar
        if (visible && freezeOnceVisible) {
          observer.disconnect()
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin, freezeOnceVisible, hasBeenVisible])

  return { ref, isVisible, hasBeenVisible }
}

// Hook para animações on-scroll
export const useScrollAnimation = (options?: UseIntersectionObserverProps) => {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
    ...options,
  })

  return {
    ref,
    initial: { opacity: 0, y: 50 },
    animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 },
    transition: { duration: 0.6, ease: 'easeOut' },
  }
}
