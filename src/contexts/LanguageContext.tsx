import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'pt' | 'en';

export interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
    // ... keep translations ...
    pt: {
        'sidebar.dashboard': 'PAINEL',
        'sidebar.calendar': 'AGENDA',
        'sidebar.clients': 'CLIENTES',
        'sidebar.projects': 'PROJETOS',
        'sidebar.finance': 'FINANCEIRO',
        'sidebar.services': 'SERVIÇOS',
        'sidebar.settings': 'CONFIGURAÇÕES',

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

        // Services
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

        // Bride Dashboard
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
        'contract.none_available': 'Nenhum contrato disponível no momento.'
    },
    en: {
        'sidebar.dashboard': 'DASHBOARD',
        'sidebar.calendar': 'CALENDAR',
        'sidebar.clients': 'CLIENTS',
        'sidebar.projects': 'PROJECTS',
        'sidebar.finance': 'FINANCE',
        'sidebar.services': 'SERVICES',
        'sidebar.settings': 'SETTINGS',

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

        // Services
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

        // Bride Dashboard
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
        'contract.none_available': 'No contract available at this time.'
    }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { t: i18nextT, i18n } = useTranslation();

    const setLanguage = (lang: Language) => {
        i18n.changeLanguage(lang);
    };

    // Custom translator that checks our local dictionary first, then falls back to i18next or key
    const t = (key: string): string => {
        const lang = (i18n.language as Language) || 'pt';
        // @ts-ignore
        return translations[lang]?.[key] || i18nextT(key) || key;
    };

    return (
        <LanguageContext.Provider
            value={{
                language: (i18n.language as Language) || 'pt',
                setLanguage,
                t
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

