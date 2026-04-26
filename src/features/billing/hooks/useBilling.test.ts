import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

import { useBillingInvoices, useCancelSubscription } from './useBilling'

const invokeSpy = vi.fn()
const successSpy = vi.fn()
const errorSpy = vi.fn()
const trackSubscriptionSpy = vi.fn()
const enforceRateLimitSpy = vi.fn()
const fromSpy = vi.fn()

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
    from: (table: string) => fromSpy(table),
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

describe('useBillingInvoices', () => {
  beforeEach(() => {
    fromSpy.mockReset()
  })

  // Helper: monta a chain .from('invoices').select().eq().order().limit()
  // que useBillingInvoices percorre. limit() retorna { data, error }.
  const mockInvoicesChain = (data: unknown, error: unknown = null) => {
    const limit = vi.fn().mockResolvedValue({ data, error })
    const order = vi.fn().mockReturnValue({ limit })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    fromSpy.mockReturnValueOnce({ select })
    return { select, eq, order, limit }
  }

  it('retorna lista de invoices com query correta', async () => {
    const fixture = [
      {
        id: 'inv-1',
        invoice_number: 'INV-2026-001',
        amount: 99.9,
        status: 'paid',
        created_at: '2026-04-01T00:00:00Z',
        due_date: '2026-04-08',
        paid_at: '2026-04-02T10:00:00Z',
      },
      {
        id: 'inv-2',
        invoice_number: 'INV-2026-002',
        amount: 99.9,
        status: 'pending',
        created_at: '2026-04-15T00:00:00Z',
        due_date: '2026-04-22',
        paid_at: null,
      },
    ]
    const chain = mockInvoicesChain(fixture)

    const { result } = renderHook(() => useBillingInvoices(), {
      wrapper: wrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fromSpy).toHaveBeenCalledWith('invoices')
    expect(chain.select).toHaveBeenCalledWith(
      'id, invoice_number, amount, status, created_at, due_date, paid_at',
    )
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'org-1')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(chain.limit).toHaveBeenCalledWith(50)
    expect(result.current.data).toEqual(fixture)
  })

  it('retorna [] quando data é null', async () => {
    mockInvoicesChain(null)
    const { result } = renderHook(() => useBillingInvoices(), {
      wrapper: wrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('propaga erro do supabase', async () => {
    mockInvoicesChain(null, { message: 'RLS denied' })
    const { result } = renderHook(() => useBillingInvoices(), {
      wrapper: wrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error & { message: string }).message).toBe(
      'RLS denied',
    )
  })
})
