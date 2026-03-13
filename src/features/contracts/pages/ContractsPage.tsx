import { useEffect, useState } from 'react'
import { useContracts } from '@/hooks/useContracts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Download, Eye, Calendar, User } from 'lucide-react'
import { ContractDialog } from '@/features/contracts/components/ContractDialog'
// Remove unused import of format if possible, but keep other imports
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/hooks/useLanguage'
import { formatDate, DATE_FORMATS } from '@/lib/date-utils'

export default function ContractsPage() {
  const { contracts, loading, fetchContracts } = useContracts()
  const { t } = useLanguage()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchContracts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return (
          <Badge className="bg-white text-black border-white rounded-none font-mono uppercase text-[10px] tracking-widest hover:bg-white/90">
            ASSINADO
          </Badge>
        )
      case 'sent':
        return (
          <Badge className="bg-transparent text-white border-white/40 rounded-none font-mono uppercase text-[10px] tracking-widest hover:border-white">
            ENVIADO
          </Badge>
        )
      default:
        return (
          <Badge className="bg-white/5 text-white/50 border-white/10 rounded-none font-mono uppercase text-[10px] tracking-widest hover:bg-white/10">
            PENDENTE
          </Badge>
        )
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-light text-white mb-2 tracking-wide uppercase">
            {t('pages.contracts.title')}
          </h1>
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
            {t('pages.contracts.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest font-bold h-10 px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('pages.contracts.new')}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-white/5 animate-pulse rounded-none border border-white/10"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <Card
              key={contract.id}
              className="bg-[#050505] border-white/10 hover:border-white/30 transition-all rounded-none group"
            >
              <CardHeader className="pb-4 border-b border-white/5">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 border border-white/10 bg-black flex items-center justify-center mb-0 group-hover:border-white/40 transition-colors">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  {getStatusBadge(contract.status)}
                </div>
                <div className="mt-4">
                  <CardTitle className="text-white text-lg font-serif font-light tracking-wide line-clamp-1">
                    {contract.title}
                  </CardTitle>
                  <CardDescription className="text-white/40 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 mt-2">
                    <User className="w-3 h-3" />
                    {contract.project?.name || 'SEM PROJETO'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-6">
                  <div className="text-[10px] text-white/30 font-mono uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    CRIADO EM{' '}
                    {formatDate(
                      contract.created_at,
                      DATE_FORMATS.DISPLAY,
                    ).toUpperCase()}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-white/10 hover:bg-white hover:text-black text-white rounded-none font-mono text-[10px] uppercase tracking-widest h-9 bg-transparent transition-all"
                      onClick={() =>
                        window.open(
                          `/projects/${contract.project_id}/contract`,
                          '_blank',
                        )
                      }
                    >
                      <Eye className="w-3 h-3 mr-2" />
                      VISUALIZAR
                    </Button>

                    {contract.status === 'signed' && (
                      <Button
                        variant="outline"
                        className="border-white/10 hover:bg-white hover:text-black text-white rounded-none w-9 h-9 p-0 bg-transparent transition-all flex items-center justify-center"
                        onClick={() => {
                          // If we implement PDF download logic here
                          // For now view is enough
                          window.open(
                            `/projects/${contract.project_id}/contract`,
                            '_blank',
                          )
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {contracts.length === 0 && (
            <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-none bg-white/[0.02]">
              <FileText className="w-10 h-10 mx-auto mb-4 text-white/20" />
              <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
                {t('pages.contracts.no_pending')}
              </p>
            </div>
          )}
        </div>
      )}

      <ContractDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) fetchContracts() // Refresh list on close
        }}
      />
    </div>
  )
}
