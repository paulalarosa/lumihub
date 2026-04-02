import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { CheckCircle, Circle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const CHECKLIST_ITEMS = [
  {
    id: 'profile_customized',
    title: 'Completar perfil',
    description: 'Suas clientes vão te encontrar pelo portal',
    path: '/configuracoes',
    cta: 'Configurar',
  },
  {
    id: 'first_client_added',
    title: 'Cadastrar primeira cliente',
    description: 'Comece organizando quem você já atende',
    path: '/clientes',
    cta: 'Adicionar',
  },
  {
    id: 'first_event_created',
    title: 'Criar primeiro evento',
    description: 'Agende um serviço na sua agenda',
    path: '/calendar',
    cta: 'Agendar',
  },
  {
    id: 'first_contract_generated',
    title: 'Gerar primeiro contrato',
    description: 'Profissionalize seus acordos com assinatura digital',
    path: '/contratos',
    cta: 'Criar',
  },
]

export const SetupChecklist = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: onboarding } = useQuery({
    queryKey: ['user-onboarding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user?.id)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!user,
  })

  if (!onboarding || onboarding.is_completed) return null

  const completedCount = CHECKLIST_ITEMS.filter(
    (item) => onboarding[item.id as keyof typeof onboarding] === true,
  ).length

  if (completedCount === CHECKLIST_ITEMS.length) return null

  const progress = (completedCount / CHECKLIST_ITEMS.length) * 100

  const nextItem = CHECKLIST_ITEMS.find(
    (item) => onboarding[item.id as keyof typeof onboarding] !== true,
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 border border-white/10 bg-white/[0.02] overflow-hidden"
    >
      {}
      <div className="h-0.5 bg-white/5">
        <motion.div
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-white">
              Configure sua conta
            </h3>
            <p className="text-xs text-white/30 mt-0.5">
              {completedCount} de {CHECKLIST_ITEMS.length} concluídos
            </p>
          </div>

          {nextItem && (
            <Button
              size="sm"
              variant="primary"
              className="text-xs group"
              onClick={() => navigate(nextItem.path)}
            >
              {nextItem.cta}
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {CHECKLIST_ITEMS.map((item) => {
            const isCompleted =
              onboarding[item.id as keyof typeof onboarding] === true
            const isNext = item.id === nextItem?.id

            return (
              <button
                key={item.id}
                onClick={() => !isCompleted && navigate(item.path)}
                disabled={isCompleted}
                className={`flex items-start gap-2.5 p-3 text-left transition-colors ${
                  isCompleted
                    ? 'opacity-40'
                    : isNext
                      ? 'border border-white/20 bg-white/[0.03]'
                      : 'border border-white/[0.06] hover:border-white/15'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`text-xs font-medium ${
                      isCompleted ? 'text-white/40 line-through' : 'text-white'
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-[10px] text-white/25 mt-0.5 hidden sm:block">
                    {item.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
