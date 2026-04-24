import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

import { useLGPD } from './useLGPD'

// Toast mock — captura chamadas pra assertar UX.
const toastSpy = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'teste@khaoskontrol.com.br' } }),
}))

vi.mock('@/services/logger', () => ({
  logger: { error: vi.fn() },
}))

// invokeEdgeFunction + supabase.rpc são os 2 pontos de contato do hook.
const invokeSpy = vi.fn()
vi.mock('@/lib/invokeEdge', () => ({
  invokeEdgeFunction: (...args: unknown[]) => invokeSpy(...args),
}))

const rpcSpy = vi.fn()
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (name: string, args?: unknown) => rpcSpy(name, args),
  },
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useLGPD', () => {
  beforeEach(() => {
    toastSpy.mockClear()
    invokeSpy.mockClear()
    rpcSpy.mockClear()

    // consentsQuery padrão: lista com 2 consents
    rpcSpy.mockImplementation(async (name: string) => {
      if (name === 'get_my_consents') {
        return {
          data: [
            {
              consent_type: 'marketing',
              granted: true,
              granted_at: '2026-01-01',
              revoked_at: null,
              version: '1.0',
            },
            {
              consent_type: 'analytics',
              granted: false,
              granted_at: null,
              revoked_at: '2026-02-01',
              version: '1.0',
            },
          ],
          error: null,
        }
      }
      return { data: null, error: null }
    })
  })

  describe('exportData', () => {
    it('baixa JSON quando edge retorna sucesso', async () => {
      const exportPayload = {
        user_id: 'user-1',
        data: { profiles: [{ id: 'user-1' }] },
      }
      invokeSpy.mockResolvedValueOnce({ data: exportPayload, error: null })

      // Mocks do DOM pra download não quebrar no jsdom.
      const createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
      const revokeObjectURL = vi.fn()
      Object.defineProperty(global.URL, 'createObjectURL', {
        value: createObjectURL,
        writable: true,
      })
      Object.defineProperty(global.URL, 'revokeObjectURL', {
        value: revokeObjectURL,
        writable: true,
      })
      const clickSpy = vi.fn()
      const originalCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag)
        if (tag === 'a') el.click = clickSpy
        return el
      })

      const { result } = renderHook(() => useLGPD(), { wrapper: makeWrapper() })
      await act(async () => {
        await result.current.exportData.mutateAsync()
      })

      expect(invokeSpy).toHaveBeenCalledWith(
        'lgpd-export',
        {},
        { passUserToken: true },
      )
      expect(createObjectURL).toHaveBeenCalledTimes(1)
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Dados exportados' }),
      )
    })

    it('mostra toast destructive quando edge falha', async () => {
      invokeSpy.mockResolvedValueOnce({
        data: null,
        error: new Error('Invalid token'),
      })

      const { result } = renderHook(() => useLGPD(), { wrapper: makeWrapper() })
      await act(async () => {
        await result.current.exportData.mutateAsync().catch(() => {})
      })

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erro ao exportar',
          variant: 'destructive',
        }),
      )
    })
  })

  describe('requestDeletion', () => {
    it('agenda nova exclusão e mostra data em pt-BR', async () => {
      invokeSpy.mockResolvedValueOnce({
        data: {
          status: 'scheduled',
          request_id: 'req-1',
          scheduled_for: '2026-05-01T00:00:00Z',
          grace_days: 7,
        },
        error: null,
      })

      const { result } = renderHook(() => useLGPD(), { wrapper: makeWrapper() })
      await act(async () => {
        await result.current.requestDeletion.mutateAsync({ reason: 'não uso mais' })
      })

      expect(invokeSpy).toHaveBeenCalledWith(
        'lgpd-delete-account',
        { action: 'request', reason: 'não uso mais' },
        { passUserToken: true },
      )
      const lastCall = toastSpy.mock.calls.at(-1)?.[0]
      expect(lastCall?.title).toBe('Solicitação registrada')
      expect(lastCall?.description).toMatch(/Exclusão agendada para/)
    })

    it('distingue quando já existe solicitação pendente', async () => {
      invokeSpy.mockResolvedValueOnce({
        data: {
          status: 'already_pending',
          request_id: 'req-old',
          scheduled_for: '2026-05-01T00:00:00Z',
        },
        error: null,
      })

      const { result } = renderHook(() => useLGPD(), { wrapper: makeWrapper() })
      await act(async () => {
        await result.current.requestDeletion.mutateAsync()
      })

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Já existe solicitação' }),
      )
    })

    it('propaga erro e mostra toast destructive', async () => {
      invokeSpy.mockResolvedValueOnce({
        data: null,
        error: new Error('DB: insert failed'),
      })

      const { result } = renderHook(() => useLGPD(), { wrapper: makeWrapper() })
      await act(async () => {
        await result.current.requestDeletion.mutateAsync().catch(() => {})
      })

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erro',
          variant: 'destructive',
        }),
      )
    })
  })

  describe('cancelDeletion', () => {
    it('cancela solicitação e confirma com toast', async () => {
      invokeSpy.mockResolvedValueOnce({
        data: { status: 'cancelled' },
        error: null,
      })

      const { result } = renderHook(() => useLGPD(), { wrapper: makeWrapper() })
      await act(async () => {
        await result.current.cancelDeletion.mutateAsync()
      })

      expect(invokeSpy).toHaveBeenCalledWith(
        'lgpd-delete-account',
        { action: 'cancel' },
        { passUserToken: true },
      )
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Cancelado' }),
      )
    })
  })

  describe('updateConsent', () => {
    it('chama record_user_consent RPC com params corretos', async () => {
      rpcSpy.mockImplementationOnce(async () => ({
        data: [],
        error: null,
      }))
      // próxima chamada (do invalidate refetch) usa o default mock

      const { result } = renderHook(() => useLGPD(), { wrapper: makeWrapper() })
      await act(async () => {
        await result.current.updateConsent.mutateAsync({
          consentType: 'marketing',
          granted: false,
        })
      })

      expect(rpcSpy).toHaveBeenCalledWith('record_user_consent', {
        p_consent_type: 'marketing',
        p_granted: false,
      })
    })
  })

  describe('isConsentGranted', () => {
    it('retorna status correto baseado em consents carregados', async () => {
      const { result } = renderHook(() => useLGPD(), { wrapper: makeWrapper() })

      await waitFor(() => {
        expect(result.current.consents).toHaveLength(2)
      })

      expect(result.current.isConsentGranted('marketing')).toBe(true)
      expect(result.current.isConsentGranted('analytics')).toBe(false)
      expect(result.current.isConsentGranted('inexistente')).toBe(false)
    })
  })
})
