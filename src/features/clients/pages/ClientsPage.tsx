import SEOHead from '@/components/seo/SEOHead'
import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Plus,
  User,
  Edit,
  Trash2,
  Star,
  Eye,
  Gem,
  MoreVertical,
  Link as LinkIcon,
  Download,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

import { MobileFAB } from '@/components/ui/MobileFAB'
import { ClientForm } from '../components/ClientForm'
import { ClientFilters } from '@/components/filters/ClientFilters'
import { useClientsQuery } from '../hooks/useClientsQuery'

import { useClientFilterStore } from '@/stores/useClientFilterStore'
import { useClientActions } from '@/features/clients/hooks/useClientActions'
import { LoadingSpinner as TableLoader } from '@/components/ui/PageLoader'
import { PageLoader } from '@/components/ui/PageLoader'

export default function Clientes() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { loading: orgLoading } = useOrganization()

  const {
    clients,
    isLoading: loadingClients,
    isError,
    refetch: fetchClients,
  } = useClientsQuery()
  const filterStore = useClientFilterStore()

  const actions = useClientActions({ fetchClients, clients })

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth')
    }
  }, [user, authLoading, navigate])

  if (authLoading || orgLoading) {
    return <PageLoader />
  }

  const filteredClients = clients

  return (
    <div className="min-h-screen bg-black flex flex-col font-mono selection:bg-white selection:text-black">
      <SEOHead title="Clientes" noindex={true} />
      <header className="border-b border-white/20 bg-black">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white hover:text-black rounded-none"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white flex items-center justify-center">
                  <User className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl text-white tracking-tight">
                    MEUS CLIENTES
                  </h1>
                  <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-mono"></div>
                </div>
              </div>
            </div>

            <Dialog
              open={actions.isDialogOpen}
              onOpenChange={(open) => {
                actions.setIsDialogOpen(open)
                if (!open) actions.setEditingClient(null)
              }}
            >
              <div className="flex items-center gap-2">
                <Button
                  onClick={actions.handleExportCSV}
                  disabled={actions.isExporting || filteredClients.length === 0}
                  variant="outline"
                  className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest h-10 px-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {actions.isExporting ? 'Exportando...' : 'Exportar CSV'}
                </Button>
                <DialogTrigger asChild>
                  <Button className="rounded-none bg-white text-black hover:bg-gray-300 font-mono text-xs uppercase tracking-widest h-10 px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
              </div>
              <DialogContent className="max-w-md bg-black border border-white p-6 rounded-none text-white">
                <DialogHeader>
                  <DialogTitle className="text-white font-serif text-2xl">
                    {actions.editingClient ? 'EDITAR CLIENTE' : 'NOVO CLIENTE'}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Formulário para gerenciamento de dados do cliente.
                  </DialogDescription>
                </DialogHeader>
                <ClientForm
                  onSubmit={actions.handleFormSubmit}
                  initialData={
                    actions.editingClient
                      ? {
                          name: actions.editingClient.name,
                          email: actions.editingClient.email || '',
                          phone: actions.editingClient.phone || '',
                          notes: actions.editingClient.notes || '',
                          is_bride: actions.editingClient.is_bride || false,
                          wedding_date: actions.editingClient.wedding_date
                            ? new Date(actions.editingClient.wedding_date)
                            : undefined,
                          access_pin: actions.editingClient.access_pin || '',
                        }
                      : undefined
                  }
                  submitLabel={
                    actions.editingClient ? 'SALVAR DADOS' : 'REGISTRAR CLIENTE'
                  }
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <ClientFilters onFiltersChange={fetchClients} />
        </div>

        <div className="space-y-4">
          {loadingClients ? (
            <TableLoader />
          ) : isError ? (
            <div className="flex justify-center py-20">
              <EmptyState
                icon={Star}
                title="FALHA NA CONEXÃO"
                description="Erro ao carregar os clientes. Verifique sua conexão ou contate o suporte."
                actionLabel="TENTAR NOVAMENTE"
                onAction={() => fetchClients()}
                className="border border-red-500/20 rounded-none bg-black text-red-100"
              />
            </div>
          ) : filteredClients.length === 0 ? (
            <EmptyState
              icon={Star}
              title={
                filterStore.search
                  ? 'REGISTRO NÃO ENCONTRADO'
                  : 'DATABASE VAZIO'
              }
              description={
                filterStore.search
                  ? 'Verifique os termos de busca.'
                  : 'Inicie o cadastro de clientes para popular o sistema.'
              }
              actionLabel={!filterStore.search ? 'INICIAR CADASTRO' : undefined}
              onAction={
                !filterStore.search
                  ? () => actions.setIsDialogOpen(true)
                  : undefined
              }
              className="border border-white/10 rounded-none bg-black"
            />
          ) : (
            <div className="space-y-6">
              {}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white hover:bg-transparent">
                      <TableHead className="text-white font-mono text-[10px] uppercase tracking-widest h-12">
                        Cliente
                      </TableHead>
                      <TableHead className="text-white font-mono text-[10px] uppercase tracking-widest h-12">
                        Contato
                      </TableHead>
                      <TableHead className="text-white font-mono text-[10px] uppercase tracking-widest h-12">
                        Última Visita
                      </TableHead>
                      <TableHead className="text-white font-mono text-[10px] uppercase tracking-widest h-12 text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className="border-b border-white/10 hover:bg-white hover:text-black group transition-colors duration-0"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-white/20 rounded-none group-hover:border-black">
                              <AvatarImage src={client.avatar_url || ''} />
                              <AvatarFallback className="bg-white/10 text-white rounded-none group-hover:bg-black group-hover:text-white font-mono">
                                {client.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm uppercase font-bold">
                                  {client.name}
                                </span>
                                {client.is_bride && (
                                  <Gem className="h-3 w-3 text-[#00e5ff] group-hover:text-black" />
                                )}
                              </div>
                              {client.email && (
                                <span className="text-xs text-gray-500 font-mono group-hover:text-black/60">
                                  {client.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.phone ? (
                            <span className="font-mono text-xs">
                              {client.phone}
                            </span>
                          ) : (
                            <span className="text-gray-600 group-hover:text-black/40 text-xs font-mono">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="w-2 h-2 bg-gray-600 group-hover:bg-black" />
                            {actions.formatDate(client.last_visit)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {client.is_bride && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  actions.copyPortalLink(client.id)
                                }
                                className="h-8 w-8 p-0 rounded-none text-white hover:bg-black hover:text-white group-hover:text-black group-hover:hover:bg-black group-hover:hover:text-white"
                                title="Copiar Link do Portal"
                              >
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/clientes/${client.id}`)}
                              className="h-8 w-8 p-0 rounded-none text-white hover:bg-black hover:text-white group-hover:text-black group-hover:hover:bg-black group-hover:hover:text-white"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => actions.openEditDialog(client)}
                              className="h-8 w-8 p-0 rounded-none text-white hover:bg-black hover:text-white group-hover:text-black group-hover:hover:bg-black group-hover:hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => actions.handleDelete(client.id)}
                              className="h-8 w-8 p-0 rounded-none text-red-500 hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="bg-black border border-white/20 p-6 rounded-none relative"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border border-white rounded-none">
                          <AvatarImage src={client.avatar_url || ''} />
                          <AvatarFallback className="bg-black text-white font-mono rounded-none border border-white/20">
                            {client.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif text-xl text-white">
                              {client.name}
                            </h3>
                            {client.is_bride && (
                              <Gem className="h-4 w-4 text-[#00e5ff]" />
                            )}
                          </div>
                          {client.phone && (
                            <div className="font-mono text-xs text-gray-500 mt-1">
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </div>

                      {client.is_bride && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-black border-white/20 rounded-none text-white">
                            <DropdownMenuItem
                              onClick={() => actions.copyPortalLink(client.id)}
                            >
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Copiar Link Portal
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                      <Button
                        variant="outline"
                        className="rounded-none border-white/20 text-xs font-mono uppercase h-10 hover:bg-white hover:text-black"
                        onClick={() => navigate(`/clientes/${client.id}`)}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-none border-white/20 text-xs font-mono uppercase h-10 hover:bg-white hover:text-black"
                        onClick={() => actions.openEditDialog(client)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-none border-red-900 text-red-500 text-xs font-mono uppercase h-10 hover:bg-red-600 hover:text-white hover:border-red-600"
                        onClick={() => actions.handleDelete(client.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <MobileFAB
        onClick={() => actions.setIsDialogOpen(true)}
        label="Novo Cliente"
      />
    </div>
  )
}
