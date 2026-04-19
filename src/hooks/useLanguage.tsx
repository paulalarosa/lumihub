import { useContext } from 'react'
import { LanguageContext, Language } from '@/contexts/LanguageContextDefinition'

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    return {
      language: 'pt' as Language,
      setLanguage: () => {},
      t: (k: string, _options?: Record<string, unknown>) => k,
    }
  }
  return context
}
