import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useIsAdmin } from '@/hooks/useIsAdmin'

export function TrialBanner() {
  const { status, daysRemaining, plan } = useSubscription()
  const { isAdmin } = useIsAdmin()
  const navigate = useNavigate()

  if (isAdmin) return null
  if (plan === 'pro' || plan === 'empire' || plan === 'studio') return null
  if (status !== 'trialing' || typeof daysRemaining !== 'number') return null

  // Influence: urgência cresce conforme dias diminuem
  const isUrgent = daysRemaining <= 3
  const isLastDay = daysRemaining <= 1

  // Influence: mensagens diferentes por fase (variable framing)
  const getMessage = () => {
    if (isLastDay) return 'Último dia do seu teste gratuito'
    if (isUrgent) return `Restam apenas ${daysRemaining} dias do seu teste`
    if (daysRemaining <= 7) return `${daysRemaining} dias restantes no teste gratuito`
    return `Teste gratuito: ${daysRemaining} dias restantes`
  }

  // Influence: CTA muda com urgência (loss aversion)
  const getCTA = () => {
    if (isLastDay) return 'Não perca seu acesso'
    if (isUrgent) return 'Garantir meu plano'
    return 'Ver planos'
  }

  return (
    <div className={`border-b transition-colors ${
      isUrgent
        ? 'bg-white/[0.06] border-white/20'
        : 'bg-white/[0.03] border-white/10'
    }`}>
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          {/* Influence: countdown visual para urgência */}
          <div className={`flex items-center justify-center w-8 h-8 border text-xs font-mono font-bold ${
            isUrgent
              ? 'border-white text-white'
              : 'border-white/20 text-white/60'
          }`}>
            {daysRemaining}
          </div>
          <span className={`${isUrgent ? 'text-white' : 'text-white/50'}`}>
            {getMessage()}
            {/* Influence: social proof inline */}
            {!isUrgent && (
              <span className="hidden sm:inline text-white/25">
                {' '}— +200 profissionais já assinam
              </span>
            )}
          </span>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/planos')}
          className={`text-xs group ${
            isUrgent
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {getCTA()}
          <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  )
}
