import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import './lib/i18n'
import './lib/sentry'

import { registerSW } from 'virtual:pwa-register'
import { validateEnv } from './config/env'
import ConfigErrorPage from './components/ui/ConfigErrorPage.tsx'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão disponível! Atualizar agora?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {},
})

import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ErrorBoundary } from './components/ErrorBoundary'

const root = createRoot(document.getElementById('root')!)

const envValidation = validateEnv()

if (!envValidation.isValid) {
  root.render(
    <StrictMode>
      <ConfigErrorPage missing={envValidation.missing} />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
              <LanguageProvider>
                <App />
              </LanguageProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}
