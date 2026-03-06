import { ReactNode } from 'react'
import { usePerformance } from '@/hooks/usePerformance'

interface PerformanceWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  require3D?: boolean
}

export const PerformanceWrapper = ({
  children,
  fallback,
  require3D = false,
}: PerformanceWrapperProps) => {
  const { canUse3D, canUseHeavyAnimations } = usePerformance()

  if (require3D && !canUse3D) {
    return <>{fallback || null}</>
  }

  if (!canUseHeavyAnimations) {
    return <>{fallback || null}</>
  }

  return <>{children}</>
}
