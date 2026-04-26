import { ReactNode } from 'react'
import { usePlanAccess } from '@/hooks/usePlanAccess'
import { useNavigate } from 'react-router-dom'
import { Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PLAN_LEVEL: Record<string, number> = {
  essencial: 0,
  profissional: 1,
  studio: 2,
}

const PLAN_COPY: Record<
  'profissional' | 'studio',
  { title: string; description: string }
> = {
  profissional: {
    title: 'Recurso do plano Profissional',
    description:
      'Esta área está incluída a partir do Profissional. Faça upgrade pra desbloquear analytics, automações, marketing e o assistente de IA.',
  },
  studio: {
    title: 'Recurso do plano Studio',
    description:
      'Esta área é exclusiva do plano Studio. Pra equipes, comissões automáticas, peer network e integrações via API.',
  },
}

interface PlanGateProps {
  plan: 'profissional' | 'studio'
  children: ReactNode
  fallback?: ReactNode
}

export const PlanGate = ({ plan, children, fallback }: PlanGateProps) => {
  const { planType, isActive, isLoading } = usePlanAccess()
  const navigate = useNavigate()

  if (isLoading) {
    return null
  }

  const userLevel = PLAN_LEVEL[planType ?? 'essencial'] ?? 0
  const requiredLevel = PLAN_LEVEL[plan]
  const hasAccess = isActive && userLevel >= requiredLevel

  if (hasAccess) return <>{children}</>
  if (fallback) return <>{fallback}</>

  const copy = PLAN_COPY[plan]

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full border border-white/10 bg-white/[0.02] p-8 text-center">
        <div className="mx-auto w-12 h-12 border border-white/20 flex items-center justify-center mb-6">
          <Lock className="w-5 h-5 text-white/60" />
        </div>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono mb-3">
          Plano {plan}
        </p>
        <h2 className="text-2xl font-serif text-white tracking-tight mb-3">
          {copy.title}
        </h2>
        <p className="text-sm text-white/50 mb-8 leading-relaxed">
          {copy.description}
        </p>
        <Button
          onClick={() => navigate('/configuracoes/assinatura')}
          variant="primary"
          size="lg"
          className="w-full group rounded-none"
        >
          <Sparkles className="w-4 h-4" />
          Fazer upgrade agora
        </Button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-[11px] text-white/30 hover:text-white/60 mt-4 font-mono uppercase tracking-wider transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}
