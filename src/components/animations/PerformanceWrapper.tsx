import { ReactNode } from 'react'
import { usePerformance } from '@/hooks/usePerformance'

interface PerformanceWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export const PerformanceWrapper = ({
  children,
  fallback,
}: PerformanceWrapperProps) => {
  const { canUseHeavyAnimations } = usePerformance()

  if (!canUseHeavyAnimations) {
    return <>{fallback || null}</>
  }

  return <>{children}</>
}
