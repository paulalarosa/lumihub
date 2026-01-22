import { useContext } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext';
import { Language } from '@/contexts/LanguageContext'; // We will need to export this type too

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
