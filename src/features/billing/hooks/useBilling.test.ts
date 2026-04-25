import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

import { useCancelSubscription } from './useBilling'

const invokeSpy = vi.fn()
const successSpy = vi.fn()
const errorSpy = vi.fn()
const trackSubscriptionSpy = vi.fn()
const enforceRateLimitSpy = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => successSpy(msg),
    error: (msg: string) => errorSpy(msg),
  },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: () => ({ organizationId: 'org-1' }),
}))

vi.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackSubscription: (event: string) => trackSubscriptionSpy(event),
  }),
}))

vi.mock('@/services/logger', () => ({
  logger: { error: vi.fn() },
}))

vi.mock('@/lib/rateLimit', () => {
  class RateLimitError extends Error {
    retryAfterMs: number
    constructor(ms: number) {
      super('rate limited')
      this.retryAfterMs = ms
      this.name = 'RateLimitError'
    }
  }
  return {
    enforceRateLimit: (...args: unknown[]) => enforceRateLimitSpy(...args),
    RateLimitError,
  }
})

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (name: string, opts: unknown) => invokeSpy(name, opts),
    },
  },
}))

function wrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

describe('useCancelSubscription', () => {
  beforeEach(() => {
    invokeSpy.mockReset()
    successSpy.mockReset()
    errorSpy.mockReset()
    trackSubscriptionSpy.mockReset()
    enforceRateLimitSpy.mockReset()
  })

  it('cancel_at_period_end: invoca edge + toast "agendado" + trackSubscription', async () => {
    invokeSpy.mockResolvedValueOnce({ data: { ok: true }, error: null })

    const { result } = renderHook(() => useCancelSubscription(), {
      wrapper: wrapper(),
    })
    await act(async () => {
      await result.current.mutateAsync('cancel_at_period_end')
    })

    expect(enforceRateLimitSpy).toHaveBeenCalledWith(
      'cancel-subscription:org-1',
      3,
      60_000,
    )
    expect(invokeSpy).toHaveBeenCalledWith('cancel-subscription', {
      body: { action: 'cancel_at_period_end' },
    })
    expect(trackSubscriptionSpy).toHaveBeenCalledWith('cancel')
    expect(successSpy).toHaveBeenCalledWith(
      'Cancelamento agendado para o fim do período atual.',
    )
  })

  it('cancel_immediately: toast próprio + trackSubscription', async () => {
    invokeSpy.mockResolvedValueOnce({ data: { ok: true }, error: null })

    const { result } = renderHook(() => useCancelSubscription(), {
      wrapper: wrapper(),
    })
    await act(async () => {
      await result.current.mutateAsync('cancel_immediately')
    })

    expect(trackSubscriptionSpy).toHaveBeenCalledWith('cancel')
    expect(successSpy).toHaveBeenCalledWith(
      'Assinatura cancelada imediatamente.',
    )
  })

  it('reactivate: não tracka cancel, toast de reativação', async () => {
    invokeSpy.mockResolvedValueOnce({ data: { ok: true }, error: null })

    const { result } = renderHook(() => useCancelSubscription(), {
      wrapper: wrapper(),
    })
    await act(async () => {
      await result.current.mutateAsync('reactivate')
    })

    expect(trackSubscriptionSpy).not.toHaveBeenCalled()
    expect(successSpy).toHaveBeenCalledWith(
      'Assinatura reativada com sucesso.',
    )
  })

  it('rate limit: mostra toast com segundos restantes, sem invocar edge', async () => {
    const { RateLimitError } = await import('@/lib/rateLimit')
    enforceRateLimitSpy.mockImplementationOnce(() => {
      throw new RateLimitError(42_000)
    })

    const { result } = renderHook(() => useCancelSubscription(), {
      wrapper: wrapper(),
    })
    await act(async () => {
      await result.current.mutateAsync('cancel_immediately').catch(() => {})
    })

    expect(invokeSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith('Muitas tentativas. Aguarde 42s.')
  })

  it('erro genérico da edge: toast fallback', async () => {
    invokeSpy.mockResolvedValueOnce({
      data: { error: 'Stripe: subscription not found' },
      error: null,
    })

    const { result } = renderHook(() => useCancelSubscription(), {
      wrapper: wrapper(),
    })
    await act(async () => {
      await result.current.mutateAsync('cancel_immediately').catch(() => {})
    })

    expect(errorSpy).toHaveBeenCalledWith(
      'Não foi possível processar a solicitação.',
    )
  })
})
