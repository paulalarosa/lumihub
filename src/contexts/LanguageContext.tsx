import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { translations as externalTranslations } from '@/utils/translations'
import { Language, LanguageContext } from './LanguageContextDefinition'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t: i18nextT, i18n } = useTranslation()

  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang)
  }

  // Translation lookup order (post-2026-04-21 consolidation):
  //   1. i18next (src/locales/{pt,en}.json) — canonical app copy.
  //   2. externalTranslations (src/utils/translations.ts) — landing page only.
  //   3. raw key fallback + dev warning so orphan keys surface fast.
  //
  // New keys MUST go to (1). (2) stays for landing-page content that pre-dates
  // this layout. If you're tempted to add a third layer, migrate the key into
  // the JSON instead.
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
