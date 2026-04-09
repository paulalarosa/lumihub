import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ArrowRight, CheckCircle, User, Sparkles, Heart } from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { useNavigate } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'

const STEPS = [
  {
    id: 'welcome',
    title: 'Sua conta está quase pronta',
    subtitle: '3 passos rápidos para você começar a organizar sua carreira',
    icon: Sparkles,
  },
  {
    id: 'profile',
    title: 'Como suas clientes vão te encontrar',
    subtitle: 'Essas informações aparecem no seu portal público',
    icon: User,
  },
  {
    id: 'first_client',
    title: 'Cadastre sua primeira cliente',
    subtitle: 'Pode ser uma cliente real ou fictícia para testar',
    icon: Heart,
  },
  {
    id: 'complete',
    title: 'Pronta para começar!',
    subtitle: 'Seu sistema está configurado',
    icon: CheckCircle,
  },
]

export const OnboardingWizard = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { trackEvent, trackConversion } = useAnalytics()
  const [step, setStep] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const [profileData, setProfileData] = useState({
    business_name: '',
    bio: '',
    phone: '',
    instagram: '',
  })

  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    event_date: '',
  })

  const { data: onboarding } = useQuery({
    queryKey: ['user-onboarding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) {
        const { data: created, error: createError } = await supabase
          .from('user_onboarding')
          .insert({ user_id: user?.id })
          .select()
          .single()
        if (createError) throw createError
        return created
      }

      return data
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (onboarding && !onboarding.is_completed && !onboarding.has_seen_tour) {
      setIsOpen(true)
    }
  }, [onboarding])

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

  const currentStep = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  const handleNext = async () => {
    if (currentStep.id === 'profile') {
      if (!profileData.business_name) {
        toast.error('Dá um nome pro seu negócio')
        return
      }

      await supabase
        .from('profiles')
        .update({
          business_name: profileData.business_name,
          bio: profileData.bio,
          phone: profileData.phone,
        })
        .eq('id', user?.id)

      await updateMutation.mutateAsync({ profile_customized: true })

      trackEvent({
        category: 'engagement',
        action: 'onboarding_profile_complete',
        label: 'profile',
      })

      toast.success('Perfil salvo! Suas clientes já podem te encontrar.')
    }

    if (currentStep.id === 'first_client') {
      if (!clientData.name) {
        toast.error('Dá um nome pra sua primeira cliente')
        return
      }

      const { error } = await supabase.from('wedding_clients').insert({
        user_id: user?.id,
        name: clientData.name,
        phone: clientData.phone || null,
        event_date: clientData.event_date || null,
      })

      if (error) {
        toast.error('Erro ao salvar cliente')
        return
      }

      await updateMutation.mutateAsync({ first_client_added: true })

      trackConversion({ conversion_id: 'first_client_added', value: 0 })
      trackEvent({
        category: 'engagement',
        action: 'onboarding_first_client',
        label: clientData.name,
      })

      toast.success(
        `${clientData.name} cadastrada! Sua primeira cliente no sistema.`,
      )
    }

    if (currentStep.id === 'complete') {
      await updateMutation.mutateAsync({
        is_completed: true,
        completed_at: new Date().toISOString(),
        has_seen_tour: true,
      })

      trackConversion({ conversion_id: 'onboarding_complete', value: 0 })
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } })
      setIsOpen(false)
      return
    }

    const nextStep = step + 1
    await updateMutation.mutateAsync({
      current_step: STEPS[nextStep].id,
    })
    setStep(nextStep)
  }

  const handleSkip = async () => {
    await updateMutation.mutateAsync({
      has_seen_tour: true,
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="bg-[#050505] border border-white/10 max-w-xl text-white p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)]">
        {}
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">
              {step + 1} de {STEPS.length}
            </p>
          </div>

          {}
          <h2 className="text-3xl font-serif text-white mb-2 tracking-tight italic">
            {currentStep.title}
          </h2>
          <p className="text-sm text-white/45 mb-10 leading-relaxed font-sans font-light">
            {currentStep.subtitle}
          </p>

          {}
          {currentStep.id === 'welcome' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { emoji: '👩💼', label: 'Perfil', desc: '30 segundos' },
                  { emoji: '💍', label: 'Cliente', desc: '30 segundos' },
                  { emoji: '🎉', label: 'Pronta!', desc: 'Imediato' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="text-center p-4 border border-white/[0.06] bg-white/[0.02]"
                  >
                    <span className="text-xl block mb-2">{item.emoji}</span>
                    <p className="text-xs text-white font-medium">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-white/30">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/25 text-center">
                Leva menos de 2 minutos
              </p>
            </div>
          )}

          {}
          {currentStep.id === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                  Nome do seu negócio *
                </label>
                <Input
                  value={profileData.business_name}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      business_name: e.target.value,
                    })
                  }
                  placeholder="Ex: Studio Glam, Maria Makeup..."
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 h-11"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                  Sobre você (aparece no seu portal)
                </label>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  rows={3}
                  placeholder="Maquiadora profissional especializada em..."
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                    WhatsApp
                  </label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    placeholder="(11) 99999-9999"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 h-11"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                    Instagram
                  </label>
                  <Input
                    value={profileData.instagram}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        instagram: e.target.value,
                      })
                    }
                    placeholder="@seu.perfil"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {}
          {currentStep.id === 'first_client' && (
            <div className="space-y-4">
              <p className="text-xs text-white/30 mb-2">
                Cadastrar uma cliente real faz você sentir o sistema funcionando
                de verdade.
              </p>

              <div>
                <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                  Nome da cliente *
                </label>
                <Input
                  value={clientData.name}
                  onChange={(e) =>
                    setClientData({ ...clientData, name: e.target.value })
                  }
                  placeholder="Ex: Ana Silva"
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                    WhatsApp da cliente
                  </label>
                  <Input
                    value={clientData.phone}
                    onChange={(e) =>
                      setClientData({ ...clientData, phone: e.target.value })
                    }
                    placeholder="(11) 99999-9999"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 h-11"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                    Data do evento
                  </label>
                  <Input
                    type="date"
                    value={clientData.event_date}
                    onChange={(e) =>
                      setClientData({
                        ...clientData,
                        event_date: e.target.value,
                      })
                    }
                    className="bg-white/[0.04] border-white/10 text-white h-11"
                  />
                </div>
              </div>

              <div className="p-3 border border-white/[0.06] bg-white/[0.02]">
                <p className="text-xs text-white/40">
                  💡 Depois de cadastrar, você pode gerar um contrato e enviar o
                  portal exclusivo para ela.
                </p>
              </div>
            </div>
          )}

          {}
          {currentStep.id === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto border border-white/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>

              <div>
                <p className="text-white/60 text-sm mb-6">
                  Seu sistema está configurado. Aqui está o que você já pode
                  fazer:
                </p>

                <div className="grid grid-cols-2 gap-3 text-left">
                  {[
                    { action: 'Gerar contrato digital', path: '/contratos' },
                    { action: 'Criar evento na agenda', path: '/calendar' },
                    { action: 'Enviar portal da noiva', path: '/clientes' },
                    { action: 'Ver seu dashboard', path: '/dashboard' },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        handleNext()
                        navigate(item.path)
                      }}
                      className="p-3 border border-white/[0.06] bg-white/[0.02] hover:border-white/20 transition-colors text-left"
                    >
                      <p className="text-xs text-white">{item.action}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">
                        → Ir agora
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {}
          <div className="flex gap-3 mt-8">
            {currentStep.id !== 'complete' && (
              <button
                onClick={handleSkip}
                className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white transition-colors py-2 px-1"
              >
                Pular Configuração
              </button>
            )}
            <div className="flex-1" />
            <Button
              onClick={handleNext}
              disabled={updateMutation.isPending}
              variant="primary"
              className="group"
            >
              {currentStep.id === 'complete' ? (
                'Ir para o Dashboard'
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
