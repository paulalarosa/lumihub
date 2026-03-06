import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LogOut, CheckCircle2, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/hooks/useLanguage'
import { DigitalSignature } from '../components/DigitalSignature'
import { useBrideDashboard } from '../hooks/useBrideDashboard'

export default function BrideDashboardPage() {
  const { t } = useLanguage()
  const d = useBrideDashboard()

  const remaining = d.totalContract - d.paidAmount
  const progress =
    d.totalContract > 0 ? (d.paidAmount / d.totalContract) * 100 : 0

  if (d.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent animate-spin rounded-full" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Loading System
          </p>
        </div>
      </div>
    )
  }

  if (d.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-500 font-serif text-xl">{d.error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!d.project) return null

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black flex flex-col">
      <header className="border-b border-neutral-800 bg-[#050505]">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <span className="font-serif italic text-xl tracking-tight text-white">
              KONTROL // Client Access
            </span>
          </div>
          <Button
            variant="ghost"
            className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white hover:bg-transparent rounded-none"
            onClick={d.handleLogout}
          >
            <LogOut className="w-3 h-3 mr-2" />
            {t('bride.logout')}
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 md:py-20">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-[#121212] border border-neutral-800">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-white data-[state=active]:text-black font-mono text-xs uppercase tracking-widest"
              >
                Visão Geral
              </TabsTrigger>
              <TabsTrigger
                value="services"
                className="data-[state=active]:bg-white data-[state=active]:text-black font-mono text-xs uppercase tracking-widest"
              >
                Serviços
              </TabsTrigger>
              <TabsTrigger
                value="contracts"
                className="data-[state=active]:bg-white data-[state=active]:text-black font-mono text-xs uppercase tracking-widest"
              >
                Contratos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-l border-neutral-800">
              <div className="lg:col-span-5 border-r border-b border-neutral-800 p-8 md:p-12 min-h-[400px] flex flex-col justify-between relative bg-[#050505]">
                <div className="mb-12">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">
                    {t('bride.welcome')}
                  </p>
                  <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight">
                    Olá,{' '}
                    <span className="italic text-neutral-400">
                      {d.project?.name ||
                        d.bride?.name?.split(' ')[0] ||
                        'Noiva'}
                    </span>
                  </h1>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                    {t('bride.countdown')}
                  </p>
                  <div className="flex items-baseline gap-4">
                    <span className="text-8xl md:text-9xl font-serif text-white leading-none tracking-tighter">
                      {d.daysLeft}
                    </span>
                    <span className="text-sm md:text-base font-mono text-neutral-500 rotate-90 origin-left translate-y-[-20px]">
                      {t('bride.days')}
                    </span>
                  </div>
                  {d.project?.event_date && (
                    <div className="mt-8 flex items-center gap-2 text-neutral-400 font-mono text-xs">
                      <CalendarDays className="w-3 h-3" />
                      {format(
                        new Date(d.project.event_date),
                        'dd . MM . yyyy',
                        { locale: ptBR },
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-rows-2">
                <div className="border-r border-b border-neutral-800 p-8 md:p-12 bg-[#050505]">
                  <h3 className="text-lg font-serif italic text-white mb-8">
                    {t('bride.journey')}
                  </h3>
                  <div className="space-y-6 max-h-[250px] overflow-y-auto scrollbar-thin pr-4">
                    {d.events.map((evt, idx) => {
                      const isPast = new Date(evt.event_date) < new Date()
                      return (
                        <div key={evt.id} className="flex gap-6 group">
                          <div className="w-24 shrink-0 text-right pt-1">
                            <span
                              className={`font-mono text-xs ${isPast ? 'text-neutral-500 line-through' : 'text-white'}`}
                            >
                              {format(new Date(evt.event_date), 'dd MMM')}
                            </span>
                          </div>
                          <div className="relative flex flex-col items-center">
                            <div
                              className={`w-1.5 h-1.5 rounded-none border border-current ${isPast ? 'bg-neutral-800 border-neutral-800' : 'bg-white border-white'} z-10`}
                            />
                            {idx !== d.events.length - 1 && (
                              <div className="w-[1px] h-full bg-neutral-900 absolute top-2" />
                            )}
                          </div>
                          <div className="pb-6 pt-0.5">
                            <p
                              className={`text-sm uppercase tracking-wider ${isPast ? 'text-neutral-600' : 'text-white'}`}
                            >
                              {evt.title}
                            </p>
                            {isPast && (
                              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-[#D4AF37] mt-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Concluído
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {d.events.length === 0 && (
                      <p className="text-neutral-600 text-xs font-mono">
                        Nenhum evento agendado.
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-r border-b border-neutral-800 p-8 md:p-12 bg-[#050505] flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-serif italic text-white">
                      {t('bride.financial')}
                    </h3>
                    {remaining <= 0 && d.totalContract > 0 && (
                      <span className="text-[10px] uppercase tracking-widest border border-[#D4AF37] text-[#D4AF37] px-2 py-1">
                        Quitado
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-8 mb-6">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                        {t('dashboard.total')}
                      </p>
                      <p className="text-lg md:text-2xl font-light text-white">
                        {d.totalContract > 0 ? (
                          `R$ ${d.totalContract.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-sm text-neutral-500 font-mono tracking-wider">
                            SOB CONSULTA
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                        {t('dashboard.paid')}
                      </p>
                      <p className="text-lg md:text-2xl font-light text-green-500">
                        R${' '}
                        {d.paidAmount.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                        {t('dashboard.pending')}
                      </p>
                      <p className="text-lg md:text-2xl font-light text-red-500">
                        R${' '}
                        {remaining.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="relative w-full h-1 bg-neutral-900">
                    <div
                      className="absolute top-0 left-0 h-full bg-white transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[9px] uppercase tracking-widest text-neutral-600 font-mono">
                    <span>{t('bride.progress')}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  {remaining > 0 && (
                    <p className="mt-4 text-[10px] text-neutral-500 font-mono">
                      {t('bride.remaining')}: R${' '}
                      {remaining.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="max-w-4xl mx-auto py-8">
              {d.services.length === 0 ? (
                <div className="text-center py-12 border border-neutral-800 bg-[#0a0a0a]">
                  <p className="text-neutral-500 font-mono text-sm">
                    Nenhum serviço mapeado para este projeto.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {d.services.map((svc) => (
                    <div
                      key={svc.id}
                      className="bg-[#0a0a0a] border border-neutral-800 p-6 flex justify-between items-center group hover:border-neutral-700 transition-colors"
                    >
                      <div>
                        <h4 className="text-white font-serif text-lg mb-1">
                          {svc.name}
                        </h4>
                        <p className="text-neutral-500 text-xs font-mono uppercase tracking-wider">
                          {svc.price > 0
                            ? `R$ ${svc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : 'Valor sob consulta'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-[10px] uppercase tracking-widest border px-2 py-1 ${svc.status === 'paid' ? 'border-green-500 text-green-500' : svc.status === 'partial' ? 'border-yellow-500 text-yellow-500' : 'border-neutral-700 text-neutral-500'}`}
                        >
                          {svc.status === 'paid'
                            ? 'Pago'
                            : svc.status === 'partial'
                              ? 'Parcial'
                              : 'Pendente'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contracts">
            <div className="max-w-4xl mx-auto py-8">
              {d.contracts.length === 0 ? (
                <div className="text-center py-12 border border-neutral-800 bg-[#0a0a0a]">
                  <p className="text-neutral-500 font-mono text-sm">
                    Nenhum contrato formal encontrado.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {d.contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="bg-[#0a0a0a] border border-neutral-800 p-6 flex justify-between items-center group hover:border-neutral-700 transition-colors"
                    >
                      <div>
                        <h4 className="text-white font-serif text-lg mb-1">
                          {contract.title ||
                            'Contrato de Prestação de Serviços'}
                        </h4>
                        <p className="text-neutral-500 text-xs font-mono uppercase tracking-wider">
                          {contract.status === 'signed'
                            ? 'Assinado em ' +
                              format(new Date(contract.signed_at), 'dd/MM/yyyy')
                            : 'Pendente de Assinatura'}
                        </p>
                      </div>
                      <div>
                        {contract.status !== 'cancelled' ? (
                          <Button
                            variant={
                              contract.status === 'signed'
                                ? 'outline'
                                : 'default'
                            }
                            className={
                              contract.status === 'signed'
                                ? 'border-neutral-800 hover:bg-neutral-900 text-neutral-300'
                                : 'bg-white text-black hover:bg-neutral-200'
                            }
                            onClick={() => {
                              if (
                                contract.status === 'signed' &&
                                contract.signature_data
                              ) {
                                const data =
                                  typeof contract.signature_data === 'string'
                                    ? JSON.parse(contract.signature_data)
                                    : contract.signature_data
                                if (data.pdf_url)
                                  window.open(data.pdf_url, '_blank')
                              } else {
                                d.setSelectedContract(contract)
                                d.setIsSigOpen(true)
                              }
                            }}
                          >
                            {contract.status === 'signed' && (
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                            )}
                            {contract.status === 'signed'
                              ? t('contract.view')
                              : t('contract.sign')}
                          </Button>
                        ) : (
                          <p className="text-sm text-neutral-600 italic">
                            Cancelado
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center text-[9px] text-neutral-700 uppercase tracking-widest font-mono">
          KONTROL Client Portal • Secure Connection
        </div>
      </main>

      {d.selectedContract && (
        <DigitalSignature
          isOpen={d.isSigOpen}
          onClose={() => d.setIsSigOpen(false)}
          contract={d.selectedContract}
          onSigned={d.refreshData}
        />
      )}
    </div>
  )
}
