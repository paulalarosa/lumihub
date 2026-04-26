import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

import { useClientMutations } from './useClientMutations'

// Spies
const createSpy = vi.fn()
const updateSpy = vi.fn()
const invokeSpy = vi.fn()
const projectsUpdateSpy = vi.fn()
const toastSpy = vi.fn()
const analyticsSpy = vi.fn()

vi.mock('../api/clientService', () => ({
  ClientService: {
    create: (data: unknown) => createSpy(data),
    update: (id: string, data: unknown) => updateSpy(id, data),
  },
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}))

vi.mock('@/services/logger', () => ({
  logger: { error: vi.fn() },
}))

vi.mock('@/services/analytics.service', () => ({
  analyticsService: { trackEvent: (e: unknown) => analyticsSpy(e) },
}))

const navigateSpy = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateSpy,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (name: string, opts: unknown) => invokeSpy(name, opts),
    },
    from: (_table: string) => ({
      update: (patch: unknown) => ({
        eq: (_col: string, id: string) => {
          projectsUpdateSpy(patch, id)
          return Promise.resolve({ error: null })
        },
      }),
    }),
    // RPC default: allowed=true (limite não bloqueia tests existentes)
    rpc: vi.fn().mockResolvedValue({
      data: { allowed: true, used: 0, limit: 10, unlimited: false },
      error: null,
    }),
  },
}))

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

describe('useClientMutations', () => {
  beforeEach(() => {
    createSpy.mockReset()
    updateSpy.mockReset()
    invokeSpy.mockReset()
    projectsUpdateSpy.mockReset()
    toastSpy.mockReset()
    analyticsSpy.mockReset()

    // window.location.origin pro portal_link build
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://test.khaoskontrol.com.br' },
      writable: true,
    })
  })

  describe('create', () => {
    it('cliente regular (não-noiva): só ClientService.create, sem portal link nem email', async () => {
      createSpy.mockResolvedValueOnce({ id: 'c-1', full_name: 'Ana' })

      const { result } = renderHook(() => useClientMutations(), {
        wrapper: makeWrapper(),
      })
      await act(async () => {
        await result.current.createMutation.mutateAsync({
          full_name: 'Ana',
          is_bride: false,
        } as never)
      })

      expect(createSpy).toHaveBeenCalledTimes(1)
      expect(updateSpy).not.toHaveBeenCalled()
      expect(invokeSpy).not.toHaveBeenCalled()
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Cliente adicionado!' }),
      )
      expect(analyticsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'client_created',
          label: 'regular',
        }),
      )
    })

    it('noiva sem email: cria + salva portal_link, mas não dispara welcome email', async () => {
      createSpy.mockResolvedValueOnce({ id: 'c-2', full_name: 'Julia' })
      updateSpy.mockResolvedValueOnce({ id: 'c-2' })

      const { result } = renderHook(() => useClientMutations(), {
        wrapper: makeWrapper(),
      })
      await act(async () => {
        await result.current.createMutation.mutateAsync({
          full_name: 'Julia',
          is_bride: true,
        } as never)
      })

      expect(updateSpy).toHaveBeenCalledWith('c-2', {
        portal_link: 'https://test.khaoskontrol.com.br/portal/c-2',
      })
      expect(invokeSpy).not.toHaveBeenCalled()
      expect(analyticsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'bride' }),
      )
    })

    it('noiva com email: cria + portal_link + dispara send-welcome-email', async () => {
      createSpy.mockResolvedValueOnce({ id: 'c-3', full_name: 'Marina' })
      updateSpy.mockResolvedValueOnce({ id: 'c-3' })
      invokeSpy.mockResolvedValueOnce({ data: null, error: null })

      const { result } = renderHook(() => useClientMutations(), {
        wrapper: makeWrapper(),
      })
      await act(async () => {
        await result.current.createMutation.mutateAsync({
          full_name: 'Marina',
          is_bride: true,
          email: 'marina@example.com',
        } as never)
      })

      expect(invokeSpy).toHaveBeenCalledWith('send-welcome-email', {
        body: {
          clientId: 'c-3',
          subject: 'Bem-vinda ao KONTROL',
        },
      })
    })

    it('erro no create: mostra toast destructive com message do erro', async () => {
      createSpy.mockRejectedValueOnce(new Error('DB: unique violation'))

      const { result } = renderHook(() => useClientMutations(), {
        wrapper: makeWrapper(),
      })
      await act(async () => {
        await result.current.createMutation
          .mutateAsync({ full_name: 'X' } as never)
          .catch(() => {})
      })

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erro ao adicionar cliente',
          description: 'DB: unique violation',
          variant: 'destructive',
        }),
      )
    })
  })

  describe('update', () => {
    it('update regular: só ClientService.update, sem side effects', async () => {
      updateSpy.mockResolvedValueOnce({ id: 'c-1' })

      const { result } = renderHook(() => useClientMutations(), {
        wrapper: makeWrapper(),
      })
      await act(async () => {
        await result.current.updateMutation.mutateAsync({
          id: 'c-1',
          data: { full_name: 'Ana Silva' } as never,
        })
      })

      expect(updateSpy).toHaveBeenCalledWith('c-1', { full_name: 'Ana Silva' })
      expect(projectsUpdateSpy).not.toHaveBeenCalled()
    })

    it('update noiva com wedding_date: sincroniza event_date em projects', async () => {
      updateSpy.mockResolvedValueOnce({ id: 'c-2' })

      const { result } = renderHook(() => useClientMutations(), {
        wrapper: makeWrapper(),
      })
      await act(async () => {
        await result.current.updateMutation.mutateAsync({
          id: 'c-2',
          data: {
            is_bride: true,
            wedding_date: '2026-08-15',
          } as never,
        })
      })

      // portal_link adicionado automaticamente
      expect(updateSpy).toHaveBeenCalledWith(
        'c-2',
        expect.objectContaining({
          is_bride: true,
          wedding_date: '2026-08-15',
          portal_link: 'https://test.khaoskontrol.com.br/portal/c-2',
        }),
      )
      expect(projectsUpdateSpy).toHaveBeenCalledWith(
        { event_date: '2026-08-15' },
        'c-2',
      )
    })

    it('erro no update: toast destructive', async () => {
      updateSpy.mockRejectedValueOnce(new Error('RLS: not allowed'))

      const { result } = renderHook(() => useClientMutations(), {
        wrapper: makeWrapper(),
      })
      await act(async () => {
        await result.current.updateMutation
          .mutateAsync({ id: 'c-1', data: {} as never })
          .catch(() => {})
      })

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erro ao atualizar cliente',
          variant: 'destructive',
        }),
      )
    })
  })
})
