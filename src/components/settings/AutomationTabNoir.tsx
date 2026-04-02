import { useState, useEffect, useCallback } from 'react'
import { motion, Variants } from 'framer-motion'
import { MessageSquare, CheckCircle2, ExternalLink } from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganization'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

export type TemplateType = 'confirmation' | 'reminder_24h' | 'thanks'

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
}

const DEFAULT_TEMPLATES: Record<TemplateType, string> = {
  confirmation:
    'Olá {client_name}! Sou da equipe da {professional_name}. Gostaria de confirmar seu agendamento para {date} às {time} em {location}. Podemos confirmar?',
  reminder_24h:
    'Oi {client_name}! Passando para lembrar do nosso agendamento amanhã ({date}) às {time}. Ansiosa para te atender! Qualquer imprevisto, me avise.',
  thanks:
    'Obrigada pela confiança, {client_name}! Foi um prazer te atender. Se puder, compartilhe sua experiência no Google: {link}. Até a próxima!',
}

const TEMPLATE_CONFIGS = [
  {
    id: 'confirmation' as TemplateType,
    title: 'CONFIRMAÇÃO DE AGENDAMENTO',
    description: 'Enviado automaticamente quando um horário é reservado.',
    variables: [
      '{client_name}',
      '{date}',
      '{time}',
      '{location}',
      '{professional_name}',
    ],
  },
  {
    id: 'reminder_24h' as TemplateType,
    title: 'LEMBRETE 24 HORAS',
    description: 'Enviado um dia antes do evento para reduzir faltas.',
    variables: ['{client_name}', '{date}', '{time}'],
  },
  {
    id: 'thanks' as TemplateType,
    title: 'AGRADECIMENTO PÓS-ATENDIMENTO',
    description: 'Envia uma mensagem de agradecimento logo após o evento.',
    variables: ['{client_name}', '{link}'],
  },
]

export function AutomationTabNoir() {
  const { user } = useAuth()
  const { organizationId } = useOrganization()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<TemplateType | null>(null)
  const [userPhone, setUserPhone] = useState<string>('')

  const [templates, setTemplates] = useState<Record<TemplateType, string>>({
    confirmation: '',
    reminder_24h: '',
    thanks: '',
  })

  const fetchUserPhone = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle()

    if (data?.phone) {
      setUserPhone(data.phone)
    }
  }, [user])

  const loadTemplates = useCallback(async () => {
    if (!organizationId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const loaded: Record<TemplateType, string> = { ...DEFAULT_TEMPLATES }

      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('organization_id', organizationId)

      if (data && !error) {
        data.forEach((t) => {
          if (t.content && t.type) loaded[t.type as TemplateType] = t.content
        })
      }

      setTemplates(loaded)
    } catch (error) {
      logger.error(error, 'AutomationTabNoir.loadTemplates', {
        showToast: false,
      })
      toast({ title: 'Erro ao carregar modelos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [organizationId, toast])

  useEffect(() => {
    fetchUserPhone()
    loadTemplates()
  }, [fetchUserPhone, loadTemplates])

  const handleSave = async (type: TemplateType) => {
    if (!organizationId) return
    setSavingId(type)

    try {
      const { error } = await supabase.from('message_templates').upsert(
        {
          organization_id: organizationId,
          type,
          content: templates[type],
          updated_at: new Date().toISOString(),
          user_id: user?.id || '',
        },
        { onConflict: 'organization_id,type' },
      )

      if (error) throw error

      toast({ title: 'Modelo salvo com sucesso!' })
    } catch (error) {
      logger.error(error, 'AutomationTabNoir.handleSave', { showToast: false })
      toast({ title: 'Erro ao salvar modelo', variant: 'destructive' })
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20 bg-[#000000] text-gray-500 font-mono uppercase text-xs">
        Carregando configurações...
      </div>
    )
  }

  return (
    <div className="w-full bg-[#000000] text-gray-300 rounded-2xl border border-white/5 p-8 shadow-2xl flex flex-col gap-10">
      {}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/10 gap-4">
        <div>
          <h2 className="text-xl font-light text-white tracking-wide">
            Modelos de <span className="font-bold">Mensagem</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure as respostas automáticas que seus clientes receberão.
          </p>
        </div>

        {}
        <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#25D366]/20 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(37,211,102,0.05)]">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366] shadow-[0_0_8px_#25D366]"></span>
          </div>
          <span className="text-xs font-mono text-[#25D366] tracking-wider uppercase">
            WhatsApp Sync Ativo
          </span>
        </div>
      </div>

      {}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {TEMPLATE_CONFIGS.map((tpl) => (
          <motion.div
            key={tpl.id}
            variants={fadeUp}
            className="group relative bg-[#0A0A0A] border border-white/10 rounded-xl p-6 transition-all duration-500 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
          >
            {}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.03] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />

            <div className="relative z-10 flex flex-col xl:flex-row gap-8">
              {}
              <div className="xl:w-1/3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={16} className="text-gray-500" />
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    {tpl.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-6">
                  {tpl.description}
                </p>

                {}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">
                    Variáveis Disponíveis
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tpl.variables.map((v) => (
                      <span
                        key={v}
                        className="font-mono text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2 py-1 rounded cursor-pointer hover:bg-white/10 hover:text-white transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(v)
                          toast({ title: 'Variável copiada!' })
                        }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {}
              <div className="xl:w-2/3 flex flex-col">
                <textarea
                  value={templates[tpl.id]}
                  onChange={(e) =>
                    setTemplates((prev) => ({
                      ...prev,
                      [tpl.id]: e.target.value,
                    }))
                  }
                  className="w-full h-32 bg-[#050505] border border-white/10 rounded-lg p-4 text-sm text-gray-300 font-mono focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 focus:bg-[#0A0A0A] transition-all resize-none shadow-inner"
                />

                {}
                <div className="mt-4 self-end flex items-center gap-4">
                  <button
                    onClick={() =>
                      setTemplates((prev) => ({
                        ...prev,
                        [tpl.id]: DEFAULT_TEMPLATES[tpl.id],
                      }))
                    }
                    className="text-[10px] uppercase font-mono tracking-widest text-gray-500 hover:text-white transition-colors"
                  >
                    Restaurar Padrão
                  </button>
                  <button
                    onClick={() => handleSave(tpl.id)}
                    disabled={savingId === tpl.id}
                    className="relative overflow-hidden bg-white text-black px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-80 w-36 h-10 flex items-center justify-center"
                  >
                    {savingId === tpl.id ? (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 size={16} /> SALVO
                      </motion.div>
                    ) : (
                      <motion.span
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                      >
                        SALVAR
                      </motion.span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {}
      <div className="bg-zinc-900/30 p-6 rounded-lg border border-white/5 mt-4">
        <h3 className="text-sm font-bold text-white tracking-wider mb-2">
          MÓDULO DE INTEGRAÇÃO
        </h3>
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Atualmente operando em modo <strong>Click-to-Send</strong>. O
            sistema abrirá o seu WhatsApp App ou Web pronto para enviar o texto
            já preenchido. As variáveis acima serão substituídas dinamicamente
            quando você acionar o botão de envio em um compromisso na sua Agenda
            ou lista de Clientes.
          </p>
          <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                Testar Conexão
              </p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                Seu Telefone: {userPhone || 'Não configurado'}
              </p>
            </div>
            <Button
              onClick={() => {
                if (!userPhone) {
                  toast({
                    title: 'Adicione um telefone ao seu perfil primeiro.',
                    variant: 'destructive',
                  })
                  return
                }
                const text = encodeURIComponent(
                  'Olá! Minha automação do KONTROL está conectada e os modelos Noir estão funcionando! 🚀',
                )
                window.open(
                  `https://wa.me/${userPhone.replace(/\D/g, '')}?text=${text}`,
                  '_blank',
                )
              }}
              disabled={!userPhone}
              variant="outline"
              className="bg-transparent border-white/20 text-white hover:bg-white hover:text-black font-mono text-[10px] uppercase tracking-widest h-10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Disparar Teste
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
