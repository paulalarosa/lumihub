import { useState, useRef, memo, useCallback } from 'react'
import { useClientsQuery } from '../hooks/useClientsQuery'
import { Client } from '@/types/api.types'
import { VirtualItem as VirtualRow } from '@tanstack/react-virtual'
import { useDeleteClient } from '../hooks/useDeleteClient'
import { useUIStore } from '@/stores/useUIStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Mail, Phone, Calendar } from 'lucide-react'
import { format } from 'date-fns/format'
import { ptBR } from 'date-fns/locale'
import { Pagination } from '@/components/ui/pagination'
import { useVirtualizer } from '@tanstack/react-virtual'

import { CreateClientDialog } from './CreateClientDialog'
import { ActionsMenu } from '@/components/ui/actions-menu'

const ClientRow = memo(
  ({
    client,
    virtualRow,
    onDelete,
  }: {
    client: Client
    virtualRow: VirtualRow
    onDelete: (id: string, name: string) => void
  }) => {
    const contractUrl = client.contract_url

    return (
      <TableRow
        key={virtualRow.key}
        data-index={virtualRow.index}
        className="border-b border-black/10 hover:bg-yellow-50 transition-colors absolute w-full flex"
        style={{
          height: `${virtualRow.size}px`,
          top: 0,
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        <TableCell className="font-medium text-black w-[30%] border-r border-black/10 flex items-center">
          <div className="flex flex-col overflow-hidden">
            <span className="font-serif text-base tracking-tight truncate">
              {client.name}
            </span>
            <span className="font-mono text-[10px] text-gray-400 uppercase">
              {client.id.slice(0, 8)}...
            </span>
          </div>
        </TableCell>
        <TableCell className="flex-1 border-r border-black/10 flex items-center overflow-hidden">
          {client.email ? (
            <div className="flex items-center gap-2 text-xs text-gray-600 truncate">
              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300">-</span>
          )}
        </TableCell>
        <TableCell className="flex-1 border-r border-black/10 flex items-center">
          {client.phone ? (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
              {client.phone}
            </div>
          ) : (
            <span className="text-xs text-gray-300">-</span>
          )}
        </TableCell>
        <TableCell className="flex-1 border-r border-black/10 flex items-center">
          {client.wedding_date ? (
            <div className="flex items-center gap-2 text-xs text-gray-600 font-mono">
              <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
              {format(new Date(client.wedding_date), 'dd/MM/yyyy', {
                locale: ptBR,
              })}
            </div>
          ) : (
            <span className="text-xs text-gray-300 font-mono">-</span>
          )}
        </TableCell>
        <TableCell className="w-[80px] border-r border-black/10 flex items-center justify-center">
          {contractUrl ? (
            <a
              href={contractUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black text-white hover:bg-yellow-500 hover:text-black transition-colors"
              title="View Contract"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </a>
          ) : (
            <span className="text-gray-300 text-xs">-</span>
          )}
        </TableCell>
        <TableCell className="w-[100px] flex items-center justify-end pr-4">
          <ActionsMenu
            id={client.id}
            contractUrl={contractUrl}
            onDelete={() => onDelete(client.id, client.name || 'Client')}
          />
        </TableCell>
      </TableRow>
    )
  },
)

ClientRow.displayName = 'ClientRow'

export const ClientsTable = () => {
  const [page, setPage] = useState(1)
  const limit = 50
  const parentRef = useRef<HTMLDivElement>(null)
  const { clients: result, isLoading, error } = useClientsQuery()
  const { mutate: deleteClient, isPending: _isDeleting } = useDeleteClient()
  const { searchTerm } = useUIStore()

  const clients = result || []
  const totalCount = clients.length
  const totalPages = Math.ceil(totalCount / limit)

  const filteredClients = clients.filter((client) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (client.name || '').toLowerCase().includes(term) ||
      (client.email || '').toLowerCase().includes(term)
    )
  })

  const rowVirtualizer = useVirtualizer({
    count: filteredClients.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  })

  const handleDelete = useCallback(
    (id: string, name: string) => {
      if (window.confirm(`CONFIRM DELETION OF TARGET: ${name}?`)) {
        deleteClient(id)
      }
    },
    [deleteClient],
  )

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 border border-white/10 bg-black/50 animate-pulse text-white font-mono">
        LOADING_DATABASE...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500/20 bg-red-950/10 text-red-400 font-mono text-sm">
        SYSTEM_ERROR: {error.message}
      </div>
    )
  }

  if (!clients.length) {
    return (
      <div className="bg-white text-black border border-black flex flex-col">
        <div className="p-4 border-b border-black flex justify-end bg-gray-50">
          <CreateClientDialog />
        </div>
        <div className="p-12 font-mono text-sm text-black/40 text-center uppercase tracking-widest">
          NO_RECORDS_IN_DATABASE
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white text-black border border-black flex flex-col">
      <div className="p-4 border-b border-black flex justify-between items-center bg-gray-50">
        <span className="font-mono text-xs uppercase text-gray-500 tracking-wider">
          Total Records:{' '}
          <span className="text-black font-bold">{totalCount}</span>
        </span>
        <CreateClientDialog />
      </div>

      <div
        ref={parentRef}
        className="h-[600px] overflow-auto relative scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent border-b border-black"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <Table>
            <TableHeader className="bg-gray-100 border-b-2 border-black sticky top-0 z-10 w-full">
              <TableRow className="border-black hover:bg-transparent bg-gray-100 flex w-full">
                <TableHead className="font-bold text-xs uppercase tracking-wider text-black w-[30%] flex items-center border-r border-black/10">
                  NOME
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-black flex-1 flex items-center border-r border-black/10">
                  EMAIL
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-black flex-1 flex items-center border-r border-black/10">
                  TELEFONE
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-black flex-1 flex items-center border-r border-black/10">
                  DATA DO EVENTO
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-black w-[80px] flex items-center justify-center border-r border-black/10">
                  DOCS
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-black w-[100px] flex items-center justify-end pr-4">
                  AÇÕES
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const client = filteredClients[virtualRow.index]
                if (!client) return null

                return (
                  <ClientRow
                    key={virtualRow.key}
                    client={client}
                    virtualRow={virtualRow}
                    onDelete={handleDelete}
                  />
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  )
}

