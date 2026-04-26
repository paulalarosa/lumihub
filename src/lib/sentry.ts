import * as Sentry from '@sentry/react'

// Aviso visível em prod quando o DSN não está setado: sem isso, Sentry
// fica silencioso e dá impressão que está funcionando. Com o aviso,
// fica óbvio que precisa configurar.
if (import.meta.env.PROD && !import.meta.env.VITE_SENTRY_DSN) {
  console.warn(
    '[Sentry] VITE_SENTRY_DSN ausente em produção — erros não estão sendo capturados',
  )
}

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    release: `khaos-kontrol@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    beforeSend(event) {
      if (event.user) {
        delete event.user.ip_address
        if (event.user.email) {
          const [local, domain] = event.user.email.split('@')
          event.user.email = `${local.slice(0, 2)}***@${domain}`
        }
      }
      return event
    },
    ignoreErrors: [
      'ResizeObserver loop',
      'Network request failed',
      'Load failed',
      'Failed to fetch',
      'AbortError',
      'ChunkLoadError',
      /Loading chunk \d+ failed/,
    ],
    denyUrls: [/extensions\//],
  })
}

export function setSentryUser(user: {
  id: string
  email?: string
  role?: string
}) {
  if (!import.meta.env.PROD) return
  Sentry.setUser({
    id: user.id,
    role: user.role,
  })
}

export function clearSentryUser() {
  if (!import.meta.env.PROD) return
  Sentry.setUser(null)
}

export function captureBusinessError(
  message: string,
  context?: Record<string, unknown>,
) {
  if (!import.meta.env.PROD) return
  Sentry.captureMessage(message, {
    level: 'error',
    tags: { type: 'business_logic' },
    extra: context,
  })
}
