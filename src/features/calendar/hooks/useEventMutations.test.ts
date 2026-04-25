import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

import { useEventMutations } from './useEventMutations'

const insertSpy = vi.fn()
const updateSpy = vi.fn()
const deleteSpy = vi.fn()
const invokeSpy = vi.fn()
const toastSpy = vi.fn()

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}))

vi.mock('@/services/logger', () => ({
  logger: { error: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/lib/security', () => ({
  sanitizeFormData: (x: Record<string, unknown>) => x,
}))

vi.mock('@/lib/invokeEdge', () => ({
  invokeEdgeFunction: (...args: unknown[]) => invokeSpy(...args),
}))

// supabase builder stub — captura insert/update/delete + retorna event mockado
vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: (_table: string) => ({
        insert: (payload: unknown) => {
          insertSpy(payload)
          return {
            select: () => ({
              single: async () => ({
                data: {
                  id: 'evt-1',
                  title: (payload as { title?: string }).title,
                  description: null,
                  event_date: (payload as { event_date?: string }).event_date,
                  start_time: (payload as { start_time?: string }).start_time,
                  end_time: (payload as { end_time?: string }).end_time,
                  location: null,
                },
                error: null,
              }),
            }),
          }
        },
        update: (patch: unknown) => ({
          eq: (_col: string, id: string) => {
            updateSpy(patch, id)
            return {
              select: () => ({
                single: async () => ({
                  data: { id, ...(patch as object), description: null, location: null },
                  error: null,
                }),
              }),
            }
          },
        }),
        delete: () => ({
          eq: async (_col: string, id: string) => {
            deleteSpy(id)
            return { error: null }
          },
        }),
      }),
    },
  }
})

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

describe('useEventMutations', () => {
  beforeEach(() => {
    insertSpy.mockReset()
    updateSpy.mockReset()
    deleteSpy.mockReset()
    invokeSpy.mockReset()
    toastSpy.mockReset()
    invokeSpy.mockResolvedValue({ data: null, error: null })
  })

  describe('create', () => {
    it('insere evento + dispara google-calendar-sync com action=create', async () => {
      const { result } = renderHook(() => useEventMutations(), { wrapper: wrapper() })
      await act(async () => {
        await result.current.createMutation.mutateAsync({
          title: 'Noiva Ana',
          start_time: '2026-05-20T14:30',
          end_time: '2026-05-20T18:00',
        } as never)
      })

      // ISO é quebrado em event_date + start_time (HH:MM) dentro do hook
      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Noiva Ana',
          event_date: '2026-05-20',
          start_time: '14:30',
          end_time: '18:00',
        }),
      )
      expect(invokeSpy).toHaveBeenCalledWith(
        'google-calendar-sync',
        expect.objectContaining({
          action: 'create',
          event_id: 'evt-1',
        }),
        { passUserToken: true },
      )
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Evento criado!' }),
      )
    })

    it('ainda retorna sucesso quando google-calendar-sync falha (não bloqueia)', async () => {
      invokeSpy.mockRejectedValueOnce(new Error('Google auth expired'))

      const { result } = renderHook(() => useEventMutations(), { wrapper: wrapper() })
      await act(async () => {
        await result.current.createMutation.mutateAsync({
          title: 'Teste',
          start_time: '2026-06-01T10:00',
          end_time: '2026-06-01T12:00',
        } as never)
      })

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Evento criado!' }),
      )
    })
  })

  describe('update', () => {
    it('atualiza evento + dispara google-calendar-sync com action=update', async () => {
      const { result } = renderHook(() => useEventMutations(), { wrapper: wrapper() })
      await act(async () => {
        await result.current.updateMutation.mutateAsync({
          id: 'evt-1',
          data: {
            title: 'Noiva Ana (remarcado)',
            start_time: '2026-05-27T14:30',
            end_time: '2026-05-27T18:00',
          } as never,
        })
      })

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Noiva Ana (remarcado)',
          event_date: '2026-05-27',
          start_time: '14:30',
          end_time: '18:00',
        }),
        'evt-1',
      )
      expect(invokeSpy).toHaveBeenCalledWith(
        'google-calendar-sync',
        expect.objectContaining({ action: 'update', event_id: 'evt-1' }),
        { passUserToken: true },
      )
    })
  })

  describe('delete', () => {
    it('deleta + dispara google-calendar-sync com action=delete', async () => {
      const { result } = renderHook(() => useEventMutations(), { wrapper: wrapper() })
      await act(async () => {
        await result.current.deleteMutation.mutateAsync('evt-9')
      })

      expect(deleteSpy).toHaveBeenCalledWith('evt-9')
      expect(invokeSpy).toHaveBeenCalledWith(
        'google-calendar-sync',
        { action: 'delete', event_id: 'evt-9' },
        { passUserToken: true },
      )
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Evento excluído!' }),
      )
    })
  })
})
