import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { translations as externalTranslations } from '@/utils/translations'
import { Language, LanguageContext } from './LanguageContextDefinition'

const inlineTranslations: Record<Language, Record<string, string>> = {
  pt: {
    'sidebar.dashboard': 'Painel',
    'sidebar.calendar': 'Agenda',
    'sidebar.clients': 'Clientes',
    'sidebar.projects': 'Projetos',
    'sidebar.finance': 'Financeiro',
    'sidebar.services': 'Serviços',
    'sidebar.settings': 'Configurações',

    'dashboard.tasks': 'TAREFAS',
    'dashboard.total_value': 'VALOR TOTAL',
    'dashboard.received': 'RECEBIDO',
    'dashboard.pending': 'PENDENTE',
    'dashboard.task_manager': 'GERENCIADOR DE TAREFAS',
    'dashboard.briefing': 'BRIEFING',
    'dashboard.contracts': 'CONTRATOS',
    'dashboard.financial': 'FINANCEIRO',
    'dashboard.preview': 'PREVIEW',
    'dashboard.internal': 'INTERNO',
    'dashboard.add_service': 'ADICIONAR SERVIÇO',
    'dashboard.register_payment': 'REGISTRAR PAGAMENTO',
    'finance.log_payment': 'REGISTRAR PAGAMENTO',

    'service.dialog.title.new': 'Novo Serviço',
    'service.dialog.title.edit': 'Editar Serviço',
    'service.name.label': 'Nome do Serviço',
    'service.name.placeholder': 'Ex: Maquiagem Social',
    'service.price.label': 'Preço (R$)',
    'service.duration.label': 'Duração',
    'service.description.label': 'Descrição',
    'service.description.placeholder': 'O que está incluso?',
    'service.save': 'Salvar',
    'service.cancel': 'Cancelar',
    'service.error.name_required': 'O nome do serviço é obrigatório',

    'dashboard.total': 'Valor Total',
    'dashboard.paid': 'Recebido',
    'bride.welcome': 'Bem-vinda',
    'bride.countdown': 'Contagem Regressiva',
    'bride.days': 'DIAS',
    'bride.days_left': 'DIAS RESTANTES',
    'bride.journey': 'Sua Jornada',
    'bride.financial': 'Financeiro',
    'bride.total': 'Total',
    'finance.total': 'Total Financeiro',
    'bride.paid': 'Pago',
    'bride.progress': 'Progresso',
    'bride.remaining': 'Restante',
    'bride.overview': 'Visão Geral',
    'bride.services': 'Serviços',
    'bride.contracts': 'Contratos',
    'bride.logout': 'Sair',
    'contract.sign': 'Assinar Contrato',
    'contract.view': 'Ver Contrato Assinado',
    'contract.none_available': 'Nenhum contrato disponível no momento.',
  },
  en: {
    'sidebar.dashboard': 'Dashboard',
    'sidebar.calendar': 'Calendar',
    'sidebar.clients': 'Clients',
    'sidebar.projects': 'Projects',
    'sidebar.finance': 'Finance',
    'sidebar.services': 'Services',
    'sidebar.settings': 'Settings',

    'dashboard.tasks': 'TASKS',
    'dashboard.total_value': 'TOTAL VALUE',
    'dashboard.received': 'RECEIVED',
    'dashboard.pending': 'PENDING',
    'dashboard.task_manager': 'TASK MANAGER',
    'dashboard.briefing': 'BRIEFING',
    'dashboard.contracts': 'CONTRACTS',
    'dashboard.financial': 'FINANCIAL',
    'dashboard.preview': 'PREVIEW',
    'dashboard.internal': 'INTERNAL',
    'dashboard.add_service': 'ADD SERVICE',
    'dashboard.register_payment': 'REGISTER PAYMENT',
    'finance.log_payment': 'REGISTER PAYMENT',

    'service.dialog.title.new': 'New Service',
    'service.dialog.title.edit': 'Edit Service',
    'service.name.label': 'Service Name',
    'service.name.placeholder': 'Ex: Bridal Makeup',
    'service.price.label': 'Price (R$)',
    'service.duration.label': 'Duration',
    'service.description.label': 'Description',
    'service.description.placeholder': 'What is included?',
    'service.save': 'Save',
    'service.cancel': 'Cancel',
    'service.error.name_required': 'Service name is required',

    'dashboard.total': 'Total Value',
    'dashboard.paid': 'Received',
    'bride.welcome': 'Welcome',
    'bride.countdown': 'Countdown',
    'bride.days': 'DAYS',
    'bride.days_left': 'DAYS LEFT',
    'bride.journey': 'Your Journey',
    'bride.financial': 'Financial',
    'bride.total': 'Total',
    'finance.total': 'Financial Total',
    'bride.paid': 'Paid',
    'bride.progress': 'Progress',
    'bride.remaining': 'Remaining',
    'bride.overview': 'Overview',
    'bride.services': 'Services',
    'bride.contracts': 'Contracts',
    'bride.logout': 'Logout',
    'contract.sign': 'Sign Contract',
    'contract.view': 'View Signed Contract',
    'contract.none_available': 'No contract available at this time.',
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t: i18nextT, i18n } = useTranslation()

  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang)
  }

  // Translation lookup order:
  //   1. i18next (src/locales/{pt,en}.json — canonical app copy)
  //   2. externalTranslations (src/utils/translations.ts — landing page)
  //   3. inlineTranslations (this file — legacy overrides being migrated out)
  //   4. return the raw key as last-resort fallback
  //
  // New keys should go to (1). (3) stays for legacy strings until each
  // section is migrated. In dev, a missing-key warning surfaces orphans.
  const t = (key: string, options?: Record<string, string | number>): string => {
    const lang = (i18n.language as Language) || 'pt'

    const i18nResult = i18nextT(key, options) as string
    if (i18nResult && i18nResult !== key) {
      return i18nResult
    }

    const source = externalTranslations[lang]
    let externalValue: unknown = source
    for (const k of key.split('.')) {
      if (
        externalValue &&
        typeof externalValue === 'object' &&
        k in externalValue
      ) {
        externalValue = externalValue[k]
      } else {
        externalValue = undefined
        break
      }
    }

    if (typeof externalValue === 'string') {
      if (options) {
        let result = externalValue
        Object.keys(options).forEach((optKey) => {
          result = result.replace(`{{${optKey}}}`, String(options[optKey]))
        })
        return result
      }
      return externalValue
    }

    const inlineValue = inlineTranslations[lang]?.[key]
    if (inlineValue) return inlineValue

    if (import.meta.env.DEV) {
      // Loud console warning in dev so orphan keys don't ship silently.
      console.warn(`[i18n] missing key "${key}" for lang "${lang}"`)
    }

    return key
  }

  return (
    <LanguageContext.Provider
      value={{
        language: (i18n.language as Language) || 'pt',
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}
