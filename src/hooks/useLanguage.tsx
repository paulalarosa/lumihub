import { useContext } from 'react';
import { LanguageContext, Language } from '@/contexts/LanguageContextDefinition';

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        // Safe fallback if context is missing
        return {
            language: 'pt' as Language,
            setLanguage: () => { },
            t: (k: string) => k
        };
    }
    return context;
}
