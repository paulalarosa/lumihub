import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  ArrowRight,
  Sparkles,
  Calendar,
  User,
  Palette,
} from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Bem-vinda ao Khaos Kontrol! 👋',
    description: 'Vamos configurar sua conta em poucos passos',
    icon: Sparkles,
  },
  {
    id: 'profile',
    title: 'Seu Perfil Profissional',
    description: 'Conte um pouco sobre você',
    icon: User,
  },
  {
    id: 'services',
    title: 'Seus Serviços',
    description: 'O que você oferece?',
    icon: Palette,
  },
  {
    id: 'calendar',
    title: 'Sincronizar Agenda',
    description: 'Conecte com Google Calendar',
    icon: Calendar,
  },
  {
    id: 'complete',
    title: 'Tudo Pronto! 🎉',
    description: 'Você está pronta para começar',
    icon: CheckCircle,
  },
]

export const OnboardingWizard = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  // Estado do formulário
  const [formData, setFormData] = useState({
    business_name: '',
    bio: '',
    specialty: '',
    instagram: '',
    phone: '',
  })

  // Buscar progresso
  const { data: onboarding } = useQuery({
    queryKey: ['user-onboarding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user?.id)
        .single()
      if (error && error.code !== 'PGRST116') throw error

      // Se não existe, criar
      if (!data) {
        const { data: newOnboarding, error: createError } = await supabase
          .from('user_onboarding')
          .insert({ user_id: user?.id })
          .select()
          .single()

        if (createError) throw createError
        return newOnboarding
      }

      return data
    },
    enabled: !!user,
  })

  // Abrir automaticamente se não completou
  useEffect(() => {
    if (onboarding && !onboarding.is_completed && !onboarding.has_seen_tour) {
      setIsOpen(true)

      // Restore current step if available
      const savedStepIndex = ONBOARDING_STEPS.findIndex(
        (s) => s.id === onboarding.current_step,
      )
      if (savedStepIndex !== -1) setCurrentStepIndex(savedStepIndex)
    }
  }, [onboarding])

  // Mutation: Atualizar progresso
  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from('user_onboarding')
        .update(updates)
        .eq('user_id', user?.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-onboarding'] })
    },
  })

  const currentStep = ONBOARDING_STEPS[currentStepIndex]
  const progress = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100

  const handleNext = async () => {
    const stepId = currentStep.id

    // Validações por step
    if (stepId === 'profile') {
      if (!formData.business_name || !formData.bio) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      // Salvar dados do perfil
      // Try to find existing artist profile or create one
      const { data: artist } = await supabase
        .from('makeup_artists')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (artist) {
        await supabase
          .from('makeup_artists')
          .update({
            name: formData.business_name,
            bio: formData.bio,
            specialty: formData.specialty,
            instagram: formData.instagram,
            phone: formData.phone,
          })
          .eq('id', artist.id)
      } else {
        // Create placeholder if needed or handle logic elsewhere
        // For now assumes profile exists or we just update onboarding
      }

      await updateMutation.mutateAsync({ profile_customized: true })
    }

    // Calcular próximo index
    const nextIndex = currentStepIndex + 1

    // Marcar step como completo
    const completedSteps = [...(onboarding?.completed_steps || [])]
    if (!completedSteps.includes(stepId)) completedSteps.push(stepId)

    // Se é o último passo (Complete)
    if (stepId === 'complete') {
      setIsOpen(false)
      return
    }

    // Se o PRÓXIMO passo é o de complete, finaliza o onboarding
    if (nextIndex === ONBOARDING_STEPS.length - 1) {
      await updateMutation.mutateAsync({
        current_step: ONBOARDING_STEPS[nextIndex].id,
        completed_steps: completedSteps,
        is_completed: true,
        completed_at: new Date().toISOString(),
        has_seen_tour: true,
      })

      // Verificar conquistas
      await supabase.rpc('check_and_unlock_achievements', {
        p_user_id: user?.id,
      })

      // Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    } else {
      // Apenas avança
      await updateMutation.mutateAsync({
        current_step: ONBOARDING_STEPS[nextIndex].id,
        completed_steps: completedSteps,
      })
    }

    setCurrentStepIndex(nextIndex)
  }

  const handleSkip = async () => {
    await updateMutation.mutateAsync({
      has_seen_tour: true,
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    setIsOpen(false)
    toast.info('Tour de onboarding pulado.')
  }

  if (!isOpen) return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && onboarding?.is_completed) setIsOpen(false)
        // Prevent closing by clicking outside if not completed (optional enforcement)
      }}
    >
      <DialogContent className="bg-neutral-900 border-neutral-800 max-w-2xl text-white sm:max-h-[90vh] overflow-y-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-400">
              Passo {currentStepIndex + 1} de {ONBOARDING_STEPS.length}
            </span>
            <span className="text-sm font-semibold text-purple-400">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <currentStep.icon className="w-10 h-10 text-purple-400" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            {currentStep.title}
          </h2>
          <p className="text-neutral-400">{currentStep.description}</p>
        </div>

        {/* Step-specific content */}
        {currentStep.id === 'welcome' && (
          <div className="space-y-4 text-center">
            <p className="text-neutral-300">
              Em menos de 5 minutos você estará pronta para gerenciar seus
              clientes, agenda e contratos de forma profissional! ✨
            </p>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-neutral-800 rounded-lg">
                <p className="text-2xl mb-2">📅</p>
                <p className="text-white font-semibold">Agenda</p>
                <p className="text-neutral-400">Sincronizada</p>
              </div>
              <div className="p-4 bg-neutral-800 rounded-lg">
                <p className="text-2xl mb-2">📱</p>
                <p className="text-white font-semibold">Instagram</p>
                <p className="text-neutral-400">Integrado</p>
              </div>
              <div className="p-4 bg-neutral-800 rounded-lg">
                <p className="text-2xl mb-2">✨</p>
                <p className="text-white font-semibold">IA</p>
                <p className="text-neutral-400">Assistente</p>
              </div>
            </div>
          </div>
        )}

        {currentStep.id === 'profile' && (
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nome do Negócio *
              </label>
              <Input
                value={formData.business_name}
                onChange={(e) =>
                  setFormData({ ...formData, business_name: e.target.value })
                }
                placeholder="Studio Glam Makeup"
                className="bg-neutral-800 border-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Sobre Você *
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                placeholder="Conte um pouco sobre sua experiência, especialidades..."
                className="bg-neutral-800 border-neutral-700"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Especialidade
                </label>
                <Input
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData({ ...formData, specialty: e.target.value })
                  }
                  placeholder="Noivas, Festas, Editorial..."
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Instagram
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-neutral-700 bg-neutral-800 text-neutral-400">
                    @
                  </span>
                  <Input
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                    placeholder="seu.usuario"
                    className="rounded-l-none bg-neutral-800 border-neutral-700"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                WhatsApp
              </label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(11) 99999-9999"
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
          </div>
        )}

        {currentStep.id === 'services' && (
          <div className="text-center space-y-4">
            <p className="text-neutral-300">
              Você pode configurar seus serviços e preços depois no menu
              Configurações
            </p>
            <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-4">
              <p className="text-purple-400 text-sm">
                💡 Dica: Defina seus serviços para gerar orçamentos automáticos!
              </p>
            </div>
          </div>
        )}

        {currentStep.id === 'calendar' && (
          <div className="text-center space-y-4">
            <p className="text-neutral-300">
              Sincronize com Google Calendar para nunca perder um compromisso
            </p>
            <Button
              variant="outline"
              size="lg"
              className="border-neutral-700 hover:bg-neutral-800 text-white"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Conectar Google Calendar
            </Button>
            <p className="text-sm text-neutral-500">
              Você pode fazer isso depois em Integrações
            </p>
          </div>
        )}

        {currentStep.id === 'complete' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Parabéns! Você está pronta! 🎉
              </h3>
              <p className="text-neutral-400">
                Sua conta está configurada e você já pode começar a agendar seus
                primeiros eventos
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-800 rounded-lg text-left">
                <p className="text-sm text-neutral-400 mb-1">Próximo passo</p>
                <p className="font-semibold text-white">
                  Cadastrar primeira cliente
                </p>
              </div>
              <div className="p-4 bg-neutral-800 rounded-lg text-left">
                <p className="text-sm text-neutral-400 mb-1">Depois</p>
                <p className="font-semibold text-white">
                  Criar primeiro evento
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          {currentStep.id !== 'complete' && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1 hover:bg-neutral-800 text-neutral-400"
            >
              Pular
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={updateMutation.isPending}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {currentStep.id === 'complete' ? (
              'Começar a Usar'
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
