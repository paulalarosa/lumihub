import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

import { useContracts } from './useContracts'
import type { Contract } from '../types'

// Mocks — useContracts é orquestração; os testes focam no que ELE faz
// (filtros + handlers), não no fetch de baixo nível (useContractsQuery)
// nem nas mutations (já cobertas em useContractMutations / outros testes).
const signMutateAsync = vi.fn()
const updateMutateAsync = vi.fn()
const errorSpy = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    error: (msg: string) => errorSpy(msg),
    success: vi.fn(),
  },
}))

vi.mock('@/services/logger', () => ({
  logger: { error: vi.fn() },
}))

vi.mock('./useContractsQuery', () => ({
  useContractsQuery: () => ({ data: contractsFixture, isLoading: false }),
}))

vi.mock('./useContractMutations', () => ({
  useContractMutations: () => ({
    signMutation: { mutateAsync: signMutateAsync, isPending: false },
    updateMutation: { mutateAsync: updateMutateAsync, isPending: false },
  }),
}))

vi.mock('@/lib/upload', () => ({
  uploadImageSafely: vi.fn().mockResolvedValue('https://cdn/sig.png'),
  deletePhotoSafely: vi.fn(),
}))

const contractsFixture: Partial<Contract>[] = [
  {
    id: 'c1',
    title: 'Contrato Casamento Paula',
    status: 'draft',
    project_id: 'p1',
    clients: { name: 'Paula Silva' },
  } as Contract,
  {
    id: 'c2',
    title: 'Contrato Debutante',
    status: 'sent',
    project_id: 'p2',
    clients: { name: 'Maria Souza' },
  } as Contract,
  {
    id: 'c3',
    title: 'Casamento Simples',
    status: 'signed',
    project_id: 'p3',
    clients: { name: 'Ana Pereira' },
  } as Contract,
]

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useContracts — filtering', () => {
  it('retorna todos os contratos por padrão', () => {
    const { result } = renderHook(() => useContracts(), { wrapper })
    expect(result.current.filteredContracts).toHaveLength(3)
  })

  it('filtra por título (case-insensitive)', () => {
    const { result } = renderHook(() => useContracts(), { wrapper })
    act(() => result.current.setSearchTerm('CASAMENTO'))
    expect(result.current.filteredContracts.map((c) => c.id)).toEqual([
      'c1',
      'c3',
    ])
  })

  it('filtra por nome do cliente', () => {
    const { result } = renderHook(() => useContracts(), { wrapper })
    act(() => result.current.setSearchTerm('maria'))
    expect(result.current.filteredContracts).toHaveLength(1)
    expect(result.current.filteredContracts[0].id).toBe('c2')
  })

  it('filtra por status', () => {
    const { result } = renderHook(() => useContracts(), { wrapper })
    act(() => result.current.setStatusFilter('signed'))
    expect(result.current.filteredContracts).toHaveLength(1)
    expect(result.current.filteredContracts[0].id).toBe('c3')
  })

  it('combina searchTerm + statusFilter', () => {
    const { result } = renderHook(() => useContracts(), { wrapper })
    act(() => {
      result.current.setSearchTerm('casamento')
      result.current.setStatusFilter('draft')
    })
    expect(result.current.filteredContracts).toHaveLength(1)
    expect(result.current.filteredContracts[0].id).toBe('c1')
  })

  it('statusFilter=all não restringe', () => {
    const { result } = renderHook(() => useContracts(), { wrapper })
    act(() => result.current.setStatusFilter('all'))
    expect(result.current.filteredContracts).toHaveLength(3)
  })
})

describe('useContracts — handleSend', () => {
  it('chama updateMutation com status sent', async () => {
    const { result } = renderHook(() => useContracts(), { wrapper })
    await act(async () => {
      await result.current.handleSend(contractsFixture[0] as Contract)
    })
    expect(updateMutateAsync).toHaveBeenCalledWith({
      id: 'c1',
      data: { status: 'sent' },
    })
  })
})

describe('useContracts — handleSignatureSave', () => {
  it('não faz nada se selectedContract for null', async () => {
    const { result } = renderHook(() => useContracts(), { wrapper })
    await act(async () => {
      await result.current.handleSignatureSave('data:image/png;base64,xxx')
    })
    expect(signMutateAsync).not.toHaveBeenCalled()
  })

  it('faz upload + chama signMutation com URL pública', async () => {
    // fetch global pra resolver dataUrl→blob
    const blob = new Blob(['x'], { type: 'image/png' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ blob: () => Promise.resolve(blob) }),
    )

    const { result } = renderHook(() => useContracts(), { wrapper })
    act(() => {
      result.current.setSelectedContract(contractsFixture[0] as Contract)
      result.current.setSignatureOpen(true)
    })

    await act(async () => {
      await result.current.handleSignatureSave('data:image/png;base64,xxx')
    })

    expect(signMutateAsync).toHaveBeenCalledWith({
      id: 'c1',
      signature_url: 'https://cdn/sig.png',
      project_id: 'p1',
    })

    await waitFor(() => {
      expect(result.current.signatureOpen).toBe(false)
    })
  })
})
