import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

import { useContractForm } from './useContractForm'

// Toast mocks — capturamos as chamadas pra assertar validações.
const sonnerError = vi.fn()
const sonnerSuccess = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => sonnerError(...args),
    success: (...args: unknown[]) => sonnerSuccess(...args),
  },
}))

const uiToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: uiToast }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: () => ({ organizationId: 'org-1' }),
}))

vi.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({ projects: [{ id: 'p-1', title: 'Casamento A' }] }),
}))

vi.mock('@/services/logger', () => ({
  logger: { error: vi.fn() },
  Logger: { action: vi.fn() },
}))

// Minimal stub pra sanitizeFormData (usado por useContractMutations) —
// evitamos re-exec do regex de sanitização, só devolvemos como veio.
vi.mock('@/lib/security', () => ({
  sanitizeFormData: (x: Record<string, unknown>) => x,
}))

// Supabase stub — capturamos insert payload e upload chamadas.
const insertSpy = vi.fn()
const uploadSpy = vi.fn()

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: (_table: string) => ({
        insert: (payload: unknown) => {
          insertSpy(payload)
          return {
            select: () => ({
              single: async () => ({
                data: { id: 'contract-1', ...(payload as object) },
                error: null,
              }),
            }),
          }
        },
      }),
      storage: {
        from: (_bucket: string) => ({
          upload: async (path: string, file: File) => {
            uploadSpy(path, file)
            return { data: { path }, error: null }
          },
          createSignedUrl: async (path: string) => ({
            data: { signedUrl: `https://signed/${path}` },
            error: null,
          }),
        }),
      },
    },
  }
})

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

function renderForm(defaults?: { defaultProjectId?: string }) {
  const onOpenChange = vi.fn()
  const hook = renderHook(
    (props: { open: boolean }) =>
      useContractForm({
        open: props.open,
        onOpenChange,
        defaultProjectId: defaults?.defaultProjectId,
      }),
    {
      wrapper: makeWrapper(),
      initialProps: { open: true },
    },
  )
  return { ...hook, onOpenChange }
}

describe('useContractForm', () => {
  beforeEach(() => {
    sonnerError.mockClear()
    sonnerSuccess.mockClear()
    uiToast.mockClear()
    insertSpy.mockClear()
    uploadSpy.mockClear()
  })

  it('bloqueia submit quando projectId e title estão vazios', async () => {
    const { result } = renderForm()
    await act(async () => {
      await result.current.handleSubmit()
    })
    expect(sonnerError).toHaveBeenCalledWith('Preencha os campos obrigatórios')
    expect(insertSpy).not.toHaveBeenCalled()
  })

  it('bloqueia submit em modo digital sem conteúdo', async () => {
    const { result } = renderForm()
    act(() => {
      result.current.setProjectId('p-1')
      result.current.setTitle('Contrato teste')
    })
    await act(async () => {
      await result.current.handleSubmit()
    })
    expect(sonnerError).toHaveBeenCalledWith('Adicione o conteúdo do contrato')
    expect(insertSpy).not.toHaveBeenCalled()
  })

  it('bloqueia submit em modo upload sem arquivo', async () => {
    const { result } = renderForm()
    act(() => {
      result.current.setMode('upload')
      result.current.setProjectId('p-1')
      result.current.setTitle('Contrato teste')
    })
    await act(async () => {
      await result.current.handleSubmit()
    })
    expect(sonnerError).toHaveBeenCalledWith('Selecione um arquivo PDF')
    expect(insertSpy).not.toHaveBeenCalled()
    expect(uploadSpy).not.toHaveBeenCalled()
  })

  it('cria contrato digital com payload correto e fecha dialog', async () => {
    const { result, onOpenChange } = renderForm()
    act(() => {
      result.current.setProjectId('p-1')
      result.current.setTitle('Contrato digital')
      result.current.setContent('<p>cláusula X</p>')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1))
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'p-1',
        title: 'Contrato digital',
        content: '<p>cláusula X</p>',
        status: 'draft',
        attachment_url: null,
        user_id: 'org-1', // prefere organizationId sobre user.id
      }),
    )
    expect(uploadSpy).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('faz upload primeiro e insere contrato com attachment_url', async () => {
    const { result, onOpenChange } = renderForm()
    const pdf = new File(['%PDF-1.4'], 'teste.pdf', { type: 'application/pdf' })

    act(() => {
      result.current.setMode('upload')
      result.current.setProjectId('p-1')
      result.current.setTitle('Contrato PDF')
      result.current.setFile(pdf)
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1))
    expect(uploadSpy).toHaveBeenCalledTimes(1)

    const [uploadPath, uploadedFile] = uploadSpy.mock.calls[0]
    expect(uploadPath).toMatch(/^org-1\/.*\.pdf$/)
    expect(uploadedFile).toBe(pdf)

    const insertPayload = insertSpy.mock.calls[0][0]
    expect(insertPayload.content).toBe('') // modo upload não envia HTML
    expect(insertPayload.attachment_url).toMatch(/^org-1\/.*\.pdf$/)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
