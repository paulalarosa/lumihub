import { ReactNode } from 'react'
import { usePlanAccess } from '@/hooks/usePlanAccess'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Lock, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface FeatureGateProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
  requiredPlan?: 'profissional' | 'studio'
}

export const FeatureGate = ({
  feature,
  children,
  fallback,
  requiredPlan,
}: FeatureGateProps) => {
  const { hasFeature } = usePlanAccess()
  const navigate = useNavigate()

  const hasAccess = hasFeature(feature)

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const likelyRequiredPlan = requiredPlan || 'profissional'

  return (
    <Alert className="bg-neutral-900 border-yellow-500/50">
      <Lock className="w-4 h-4 text-yellow-500" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex flex-col">
          <p className="text-white font-semibold mb-1">Recurso Premium</p>
          <p className="text-neutral-400 text-sm">
            Esta funcionalidade está disponível no plano{' '}
            <span className="text-yellow-500 font-semibold uppercase">
              {likelyRequiredPlan}
            </span>
          </p>
        </div>
        <Button
          onClick={() => navigate('/settings?tab=subscription')}
          variant="outline"
          className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black ml-4"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Fazer Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  )
}
