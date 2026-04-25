import { ActionButton } from '@/components/ui/action-buttons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  Plus,
  FileText,
  CheckCircle2,
  Calendar,
  PenTool,
  Pencil,
  Send,
  Loader2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns/format'
import { StatusBadge } from '@/components/ui/status-badge'
import { ContractDialog } from '@/features/contracts/components/ContractDialog'
import { SignatureModal } from '@/features/contracts/components/SignatureModal'
import { LazyContractPdfButton } from '@/features/contracts/components/LazyContractPdfButton'
import { useContracts } from '@/features/contracts/hooks/useContracts'
import { sanitizeHTML } from '@/lib/sanitize'
import { useLanguage } from '@/hooks/useLanguage'

export default function Contracts() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const {
    filteredContracts,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isDialogOpen,
    setIsDialogOpen,
    signatureOpen,
    setSignatureOpen,
    selectedContract: _selectedContract,
    setSelectedContract,
    handleSignatureSave,
    handleSend,
    isSending,
  } = useContracts()

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white">
            {t('contracts.title')}
          </h1>
          <p className="text-white/60">{t('contracts.subtitle')}</p>
        </div>
        <ActionButton onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('contracts.new')}
        </ActionButton>
      </div>

      <ContractDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      <div className="flex flex-col md:flex-row gap-4 bg-black p-4 border border-white/20">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder={t('contracts.search_placeholder').toUpperCase()}
            className="pl-10 bg-transparent border-white/20 text-white placeholder:text-white/30 rounded-none focus:border-white font-mono text-xs uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-full w-fit mb-6 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors rounded-full ${statusFilter === 'all' ? 'bg-white/20 text-white backdrop-blur-md shadow-sm border border-white/30 font-bold' : 'text-white/60 hover:text-white border border-transparent'}`}
            >
              {t('contracts.filters.all')}
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors rounded-full ${statusFilter === 'draft' ? 'bg-white/20 text-white backdrop-blur-md shadow-sm border border-white/30 font-bold' : 'text-white/60 hover:text-white border border-transparent'}`}
            >
              {t('contracts.filters.draft')}
            </button>
            <button
              onClick={() => setStatusFilter('sent')}
              className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors rounded-full ${statusFilter === 'sent' ? 'bg-white/20 text-white backdrop-blur-md shadow-sm border border-white/30 font-bold' : 'text-white/60 hover:text-white border border-transparent'}`}
            >
              {t('contracts.filters.sent')}
            </button>
            <button
              onClick={() => setStatusFilter('signed')}
              className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors rounded-full ${statusFilter === 'signed' ? 'bg-white/20 text-white backdrop-blur-md shadow-sm border border-white/30 font-bold' : 'text-white/60 hover:text-white border border-transparent'}`}
            >
              {t('contracts.filters.signed')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-white/40 font-mono uppercase text-xs">
            Carregando seus documentos...
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-lg">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-serif text-lg">
              Nenhum contrato encontrado
            </h3>
            <p className="text-white/40 text-sm mt-2">
              Crie um novo contrato para começar.
            </p>
          </div>
        ) : (
          filteredContracts.map((contract) => (
            <Card
              key={contract.id}
              className="bg-white/5 border-white/10 backdrop-blur-sm group hover:border-white/30 transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-white font-medium text-lg leading-tight group-hover:text-white transition-colors">
                      {contract.title}
                    </CardTitle>
                    <p className="text-white/50 text-xs uppercase tracking-wider font-mono">
                      {contract.clients?.name}
                    </p>
                  </div>
                  <StatusBadge
                    label={
                      contract.status === 'signed'
                        ? t('contracts.status.signed')
                        : contract.status === 'sent'
                          ? t('contracts.status.sent')
                          : t('contracts.status.draft')
                    }
                    color={
                      contract.status === 'signed'
                        ? 'success'
                        : contract.status === 'sent'
                          ? 'info'
                          : 'neutral'
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(contract.created_at), 'dd/MM/yyyy')}
                  </div>
                  {contract.signed_at && (
                    <div className="flex items-center gap-1.5 text-green-500/70">
                      <CheckCircle2 className="w-3 h-3" />
                      {format(new Date(contract.signed_at), 'dd/MM')}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button
                    variant="outline"
                    disabled={!contract.project_id}
                    onClick={() =>
                      contract.project_id &&
                      navigate(`/projects/${contract.project_id}/contract`)
                    }
                    className="border-white/10 text-white hover:bg-white/5 h-8 text-[10px] uppercase tracking-wider font-mono disabled:opacity-30"
                    title={
                      contract.project_id
                        ? 'Editar conteúdo'
                        : 'Sem projeto vinculado'
                    }
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  {contract.status === 'draft' && (
                    <Button
                      variant="outline"
                      disabled={isSending}
                      onClick={() => handleSend(contract)}
                      className="border-white/10 text-white hover:bg-white/5 h-8 text-[10px] uppercase tracking-wider font-mono"
                    >
                      {isSending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3 mr-1" />
                      )}
                      Enviar
                    </Button>
                  )}
                  {contract.status !== 'draft' && contract.status !== 'signed' && (
                    <ActionButton
                      className="h-8 text-[10px]"
                      onClick={() => {
                        setSelectedContract(contract)
                        setSignatureOpen(true)
                      }}
                    >
                      Assinar
                    </ActionButton>
                  )}
                  {contract.status === 'signed' && (
                    <LazyContractPdfButton
                      contract={contract}
                      fileName={`contrato-${contract.title.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                    >
                      {({ loading: pdfLoading }) => (
                        <ActionButton
                          fullWidth
                          className="h-8 text-[10px]"
                          disabled={pdfLoading}
                        >
                          {pdfLoading ? t('contracts.actions.pdf_loading') : t('contracts.actions.download')}
                        </ActionButton>
                      )}
                    </LazyContractPdfButton>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-white/10 text-white hover:bg-white/5 h-8 text-xs uppercase tracking-wider font-bold"
                      >
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[80vh] bg-[#1A1A1A] border-white/10 text-white overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{contract.title}</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4 space-y-4">
                        <div className="bg-white/5 text-white/90 p-8 rounded-[2.5rem] min-h-[500px] border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md font-serif text-sm leading-relaxed whitespace-pre-wrap">
                          <h2 className="text-center text-xl font-bold mb-8 uppercase tracking-widest border-b-2 border-black pb-4">
                            Contrato de Prestação de Serviços
                          </h2>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHTML(contract.content || ''),
                            }}
                          />

                          <div className="mt-12 grid grid-cols-2 gap-12 pt-8">
                            {contract.signature_url ? (
                              <div className="text-center">
                                <img
                                  src={contract.signature_url}
                                  alt="Assinatura"
                                  className="h-16 mx-auto mb-2 mix-blend-multiply"
                                />
                                <div className="border-t border-black pt-2 font-bold uppercase text-xs">
                                  {contract.clients?.name}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1">
                                  {t('contracts.actions.signed_at')}{' '}
                                  {format(
                                    new Date(contract.signed_at || ''),
                                    'dd/MM/yyyy HH:mm',
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center opacity-30">
                                <div className="h-16 mb-2 border-b border-black"></div>
                                <div className="font-bold uppercase text-xs">
                                  {contract.clients?.name}
                                </div>
                                <div className="text-[10px] mt-1">
                                  (Aguardando Assinatura)
                                </div>
                              </div>
                            )}

                            <div className="text-center">
                              <div className="h-16 mb-2 flex items-end justify-center">
                                <div className="font-script text-2xl text-black">
                                  Khaos Kontrol
                                </div>
                              </div>
                              <div className="border-t border-black pt-2 font-bold uppercase text-xs text-black">
                                CONTRATADA
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                          <LazyContractPdfButton
                            contract={contract}
                            fileName={`contrato-${contract.title.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                          >
                            {({ loading: pdfLoading }) => (
                              <Button
                                variant="outline"
                                disabled={pdfLoading}
                                className="border-white/10 text-white hover:bg-white/10"
                              >
                                {pdfLoading ? t('contracts.actions.generating_pdf') : t('contracts.actions.download_pdf')}
                              </Button>
                            )}
                          </LazyContractPdfButton>

                          {contract.status !== 'signed' && (
                            <ActionButton
                              onClick={() => {
                                setSelectedContract(contract)
                                setSignatureOpen(true)
                              }}
                            >
                              <PenTool className="w-4 h-4 mr-2" />
                              Coletar Assinatura Agora
                            </ActionButton>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <SignatureModal
        isOpen={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onConfirm={handleSignatureSave}
      />
    </div>
  )
}
