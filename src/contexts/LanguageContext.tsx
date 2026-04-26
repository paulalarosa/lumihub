import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Language, LanguageContext } from './LanguageContextDefinition'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t: i18nextT, i18n } = useTranslation()

  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang)
  }

  // Single source of truth: src/locales/{pt,en}.json via i18next.
  // Se a key não existir, devolve a própria key + warn em dev pra
  // surface fast.
  const t = (key: string, options?: Record<string, string | number>): string => {
    const lang = (i18n.language as Language) || 'pt'
    const i18nResult = i18nextT(key, options) as string

    if (i18nResult && i18nResult !== key) {
      return i18nResult
    }

    if (import.meta.env.DEV) {
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
