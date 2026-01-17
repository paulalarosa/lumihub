import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from '@/utils/translations';

type Language = 'pt' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('pt');

    const t = (key: string): string => {
        // Check if key exists in the current language
        const currentLangTranslations = translations[language] as Record<string, string>;
        if (key in currentLangTranslations) {
            return currentLangTranslations[key];
        }

        // Fallback to Portuguese if missing
        const fallbackTranslations = translations['pt'] as Record<string, string>;
        if (key in fallbackTranslations) {
            console.warn(`Translation missing for key "${key}" in language "${language}". Falling back to PT.`);
            return fallbackTranslations[key];
        }

        // Return key itself if completely missing
        console.warn(`Translation missing for key "${key}".`);
        return key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
