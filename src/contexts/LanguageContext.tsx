import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Language = 'pt' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { t, i18n } = useTranslation();

    const setLanguage = (lang: Language) => {
        i18n.changeLanguage(lang);
    };

    return (
        <LanguageContext.Provider
            value={{
                language: (i18n.language as Language) || 'pt',
                setLanguage,
                t: (key) => t(key, { defaultValue: key }) // Bridge for compatibility
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        // Safe fallback if context is missing (though it shouldn't be now)
        return {
            language: 'pt' as Language,
            setLanguage: () => { },
            t: (k: string) => k
        };
    }
    return context;
}
