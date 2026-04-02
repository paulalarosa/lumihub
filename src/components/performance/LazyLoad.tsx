import {
  lazy,
  Suspense,
  ComponentType,
  useState,
  useRef,
  useEffect,
} from 'react'
import { motion } from 'framer-motion'

const LoadingSkeleton = ({
  type = 'default',
}: {
  type?: 'default' | 'card' | 'hero'
}) => {
  const skeletons = {
    default: (
      <div className="animate-pulse bg-white/5 rounded-lg h-64 w-full" />
    ),
    card: (
      <div className="animate-pulse space-y-4">
        <div className="bg-white/5 rounded-xl h-48 w-full" />
        <div className="bg-white/5 rounded h-4 w-3/4" />
        <div className="bg-white/5 rounded h-4 w-1/2" />
      </div>
    ),
    hero: (
      <div className="animate-pulse space-y-8">
        <div className="bg-white/5 rounded h-16 w-full max-w-2xl" />
        <div className="bg-white/5 rounded h-8 w-full max-w-xl" />
      </div>
    ),
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      {skeletons[type]}
    </motion.div>
  )
}

export const lazyLoadComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallbackType: 'default' | 'card' | 'hero' = 'default',
) => {
  const LazyComponent = lazy(importFunc)

  return (props: any) => (
    <Suspense fallback={<LoadingSkeleton type={fallbackType} />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

export const LazySection = ({
  children,
  threshold = 0.1,
  rootMargin = '50px',
}: {
  children: React.ReactNode
  threshold?: number
  rootMargin?: string
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return <div ref={ref}>{isVisible ? children : <LoadingSkeleton />}</div>
}
