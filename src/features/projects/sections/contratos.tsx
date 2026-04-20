import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  ExternalLink,
  FileText,
  Sparkles,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react'
import type {
  Contract,
  ProjectWithRelations,
  ProjectServiceItem,
} from '@/types/api.types'
import { useContracts } from '../hooks/useContracts'

interface ContratosTabProps {
  projectId: string
  contracts: Contract[]
  setContracts: (contracts: Contract[]) => void
  project: ProjectWithRelations
  projectServices: ProjectServiceItem[]
  totalValue: number
}

export function ContractsTab({
  projectId,
  contracts,
  setContracts,
  project,
  projectServices,
  totalValue,
}: ContratosTabProps) {
  const {
    isContractDialogOpen,
    setIsContractDialogOpen,
    contractTitle,
    setContractTitle,
    contractContent,
    setContractContent,
    loadingAI,
    loadingEdit,
    aiCommand,
    setAiCommand,
    contractor,
    handleSaveContract,
    handleExportPDF,
    shareOnWhatsApp,
    handleArchitectMode,
    handleEditorMode,
  } = useContracts({
    projectId,
    project,
    projectServices,
    totalValue,
    setContracts,
  })

  return (
    <Card className="bg-black border border-white/20 rounded-none">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
        <div>
          <CardTitle className="text-white font-serif uppercase tracking-wide">
            LEGAL_DOCS
          </CardTitle>
          <CardDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">
            CONTRACTS & AGREEMENTS
          </CardDescription>
        </div>
        <Dialog
          open={isContractDialogOpen}
          onOpenChange={setIsContractDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
              <Plus className="h-3 w-3 mr-2" />
              NEW_CONTRACT
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-black border border-white/20 rounded-none h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-white font-serif uppercase tracking-wide">
                LEGAL_DOCS_AI
              </DialogTitle>
              <DialogDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">
                Use a Inteligência Artificial para criar ou refinar seus
                contratos.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <form
                onSubmit={handleSaveContract}
                className="space-y-4 border-b border-white/10 pb-6"
              >
                <div className="space-y-2">
                  <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">
                    TÍTULO DO DOCUMENTO
                  </Label>
                  <Input
                    value={contractTitle}
                    onChange={(e) => setContractTitle(e.target.value)}
                    placeholder="EX: CONTRATO DE PRESTAÇÃO DE SERVIÇOS"
                    className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 font-mono text-xs uppercase tracking-widest">
                    CONTEÚDO (MARKDOWN/TEXTO)
                  </Label>
                  <Textarea
                    value={contractContent}
                    onChange={(e) => setContractContent(e.target.value)}
                    placeholder="O conteúdo será gerado aqui..."
                    rows={12}
                    className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white text-sm leading-relaxed"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!contractContent}
                  className="w-full bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest"
                >
                  SALVAR CONTRATO
                </Button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                {}
                <div className="space-y-3 p-4 border border-white/10 bg-white/5">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-serif uppercase tracking-wide text-sm">
                      CRIAR DO ZERO
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 font-mono leading-tight">
                    Gera um contrato completo de ~10 cláusulas baseado nos dados
                    do projeto.
                  </p>
                  <Button
                    type="button"
                    onClick={handleArchitectMode}
                    disabled={loadingAI || !contractor}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-[#D4AF37] hover:text-black hover:border-transparent rounded-none font-mono text-[10px] uppercase tracking-widest h-auto py-3 whitespace-normal text-center"
                  >
                    {loadingAI
                      ? 'GERANDO...'
                      : 'GERAR ESTRUTURA COMPLETA (LEGAL ARCHITECT)'}
                  </Button>
                  {!contractor && (
                    <p className="text-[9px] text-red-400 font-mono mt-1 text-center flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Perfil incompleto (CPF/Endereço)
                    </p>
                  )}
                </div>

                {}
                <div className="space-y-3 p-4 border border-white/10 bg-white/5">
                  <div className="flex items-center gap-2 text-white justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-white" />
                      <span className="font-serif uppercase tracking-wide text-sm">
                        REFINAR / EDITAR
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleExportPDF}
                        title="Baixar PDF"
                      >
                        <FileText className="h-3 w-3 text-white/70" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={shareOnWhatsApp}
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3 text-white/70" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/50 font-mono leading-tight">
                    Ajusta cláusulas específicas mantendo a estrutura original.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={aiCommand}
                      onChange={(e) => setAiCommand(e.target.value)}
                      placeholder="Ex: Altere a multa para 20%..."
                      className="bg-black border-white/20 rounded-none text-white font-mono text-[10px] h-8"
                      onKeyDown={(e) => e.key === 'Enter' && handleEditorMode()}
                    />
                    <Button
                      type="button"
                      onClick={handleEditorMode}
                      disabled={
                        loadingEdit || !contractContent || !aiCommand.trim()
                      }
                      variant="secondary"
                      className="rounded-none font-mono text-[10px] uppercase tracking-widest h-8"
                    >
                      {loadingEdit ? '...' : 'APLICAR'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-6">
        {contracts.length === 0 ? (
          <p className="text-white/20 text-center py-8 font-mono uppercase text-xs tracking-widest border border-white/10 border-dashed">
            NO_DOCUMENTS_FILED
          </p>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-4 border border-white/10 bg-white/5 hover:border-white/30 transition-colors"
              >
                <div>
                  <p className="font-serif text-white uppercase tracking-wide text-sm mb-1">
                    {contract.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={`rounded-none font-mono text-[9px] uppercase tracking-widest border-white/20 text-white/50`}
                  >
                    STATUS: {contract.status}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase"
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  VIEW
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
