import { useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  FolderOpen,
  Calendar,
  ClipboardList,
  Search,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useNewProjectWizard } from '../hooks/useNewProjectWizard'

type WizardHook = ReturnType<typeof useNewProjectWizard>
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STEP_LABELS = ['CLIENTE', 'PROJETO', 'EVENTO', 'CONFIRMAR']
const STEP_ICONS = [User, FolderOpen, Calendar, ClipboardList]

interface NewProjectWizardProps {
  trigger?: React.ReactNode
  preselectedClientId?: string
  onSuccess?: () => void

  externalOpen?: boolean
  onExternalClose?: () => void
  wizardHook?: WizardHook
}

export function NewProjectWizard({
  trigger,
  preselectedClientId,
  onSuccess,
  externalOpen,
  onExternalClose,
  wizardHook,
}: NewProjectWizardProps) {
  const internalHook = useNewProjectWizard(onSuccess)
  const w = wizardHook ?? internalHook

  const isDialogOpen = externalOpen !== undefined ? externalOpen : w.open
  const handleDialogClose = () => {
    if (onExternalClose) onExternalClose()
    else w.closeWizard()
  }
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isDialogOpen && w.step === 0) {
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [isDialogOpen, w.step])

  const renderTrigger = externalOpen === undefined

  return (
    <>
      {renderTrigger && (
        trigger ? (
          <div onClick={() => w.openWizard(preselectedClientId)}>{trigger}</div>
        ) : (
          <Button
            onClick={() => w.openWizard(preselectedClientId)}
            className="gap-2 bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" />
            NOVO PROJETO
          </Button>
        )
      )}

      <Dialog open={isDialogOpen} onOpenChange={(o) => !o && handleDialogClose()}>
        <DialogContent className="max-w-2xl bg-black border border-white/20 rounded-none text-white p-0 gap-0 overflow-hidden">

          <DialogHeader className="px-8 pt-8 pb-0">
            <div className="mb-6">
              <DialogTitle className="font-serif text-2xl uppercase tracking-tight">
                Novo Projeto
              </DialogTitle>
              <DialogDescription className="sr-only">
                Crie um novo projeto em 4 passos: cliente, projeto, evento e confirmação.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-0">
              {STEP_LABELS.map((label, i) => {
                const Icon = STEP_ICONS[i]
                const isActive = i === w.step
                const isDone = i < w.step
                return (
                  <div key={i} className="flex items-center flex-1">
                    <div className={`flex items-center gap-2 px-3 py-2 flex-1 border-b-2 transition-all ${
                      isActive ? 'border-white' : isDone ? 'border-white/30' : 'border-white/10'
                    }`}>
                      <div className={`w-6 h-6 flex items-center justify-center border transition-all ${
                        isActive
                          ? 'border-white bg-white text-black'
                          : isDone
                          ? 'border-white/40 bg-white/10 text-white/60'
                          : 'border-white/20 text-white/20'
                      }`}>
                        {isDone ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Icon className="w-3 h-3" />
                        )}
                      </div>
                      <span className={`font-mono text-[9px] uppercase tracking-widest hidden sm:block ${
                        isActive ? 'text-white' : isDone ? 'text-white/40' : 'text-white/20'
                      }`}>
                        {label}
                      </span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-white/20 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </DialogHeader>

          <div className="px-8 py-6 min-h-[340px]">

            {w.step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                    {w.state.clientMode === 'select' ? 'Selecionar cliente' : 'Cadastrar nova cliente'}
                  </Label>
                  <button
                    onClick={() => {
                      w.update('clientMode', w.state.clientMode === 'select' ? 'create' : 'select')
                      w.update('clientId', '')
                    }}
                    className="font-mono text-[9px] uppercase tracking-widest text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-2 py-1 transition-all flex items-center gap-1"
                  >
                    {w.state.clientMode === 'select' ? (
                      <><Plus className="w-3 h-3" /> Nova cliente</>
                    ) : (
                      <><Search className="w-3 h-3" /> Buscar existente</>
                    )}
                  </button>
                </div>

                {w.state.clientMode === 'select' ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                      <Input
                        ref={searchRef}
                        placeholder="Buscar por nome ou email..."
                        value={w.clientSearch}
                        onChange={(e) => w.setClientSearch(e.target.value)}
                        className="pl-10 bg-black border-white/20 rounded-none text-white font-mono text-sm focus:border-white placeholder:text-white/20"
                      />
                    </div>

                    {w.loadingClients ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-white/40" />
                      </div>
                    ) : w.filteredClients.length === 0 ? (
                      <div className="border border-white/10 border-dashed p-6 text-center">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                          {w.clientSearch ? 'Nenhuma cliente encontrada' : 'Nenhuma cliente cadastrada'}
                        </p>
                        <button
                          onClick={() => {
                            w.update('clientMode', 'create')
                            if (w.clientSearch) w.update('newClientName', w.clientSearch)
                          }}
                          className="mt-3 font-mono text-[9px] uppercase tracking-widest text-white/50 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 transition-all flex items-center gap-1 mx-auto"
                        >
                          <Plus className="w-3 h-3" /> Cadastrar nova cliente
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
                        {w.filteredClients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => w.update('clientId', client.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 border transition-all text-left ${
                              w.state.clientId === client.id
                                ? 'border-white bg-white text-black'
                                : 'border-white/10 hover:border-white/30 text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 flex items-center justify-center font-mono text-[10px] font-bold border ${
                                w.state.clientId === client.id
                                  ? 'border-black/20 text-black'
                                  : 'border-white/20 text-white/60'
                              }`}>
                                {client.full_name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className={`font-mono text-xs uppercase tracking-wide font-medium ${
                                  w.state.clientId === client.id ? 'text-black' : 'text-white'
                                }`}>
                                  {client.full_name}
                                </p>
                                {client.email && (
                                  <p className={`font-mono text-[9px] ${
                                    w.state.clientId === client.id ? 'text-black/50' : 'text-white/40'
                                  }`}>
                                    {client.email}
                                  </p>
                                )}
                              </div>
                            </div>
                            {w.state.clientId === client.id && (
                              <Check className="w-4 h-4 text-black" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                        Nome completo <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        value={w.state.newClientName}
                        onChange={(e) => w.update('newClientName', e.target.value)}
                        placeholder="Nome da cliente"
                        className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white placeholder:text-white/20"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                          Email
                        </Label>
                        <Input
                          type="email"
                          value={w.state.newClientEmail}
                          onChange={(e) => w.update('newClientEmail', e.target.value)}
                          placeholder="email@exemplo.com"
                          className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white placeholder:text-white/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                          Telefone
                        </Label>
                        <Input
                          value={w.state.newClientPhone}
                          onChange={(e) => w.update('newClientPhone', e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white placeholder:text-white/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {w.step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                      Nome do projeto <span className="text-red-400">*</span>
                    </Label>
                    {w.state.eventType && !w.state.projectName && (
                      <button
                        onClick={w.autoSuggestName}
                        className="font-mono text-[9px] uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" /> Sugerir nome
                      </button>
                    )}
                  </div>
                  <Input
                    value={w.state.projectName}
                    onChange={(e) => w.update('projectName', e.target.value)}
                    placeholder="Ex: Casamento Ana & Pedro"
                    className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white placeholder:text-white/20"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                    Tipo de evento <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={w.state.eventType}
                    onValueChange={(v) => w.update('eventType', v)}
                  >
                    <SelectTrigger className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white">
                      <SelectValue placeholder="Selecionar tipo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-white/20 rounded-none text-white">
                      {w.EVENT_TYPES.map((type) => (
                        <SelectItem
                          key={type}
                          value={type}
                          className="font-mono text-xs focus:bg-white focus:text-black"
                        >
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                    Valor total (R$)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={w.state.budget}
                    onChange={(e) => w.update('budget', e.target.value)}
                    placeholder="0,00"
                    className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white placeholder:text-white/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                    Observações
                  </Label>
                  <textarea
                    value={w.state.notes}
                    onChange={(e) => w.update('notes', e.target.value)}
                    placeholder="Notas internas sobre o projeto..."
                    rows={3}
                    className="w-full px-3 py-2 bg-black border border-white/20 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-white resize-none"
                  />
                </div>
              </div>
            )}

            {w.step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                      Data do evento <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={w.state.eventDate}
                      onChange={(e) => w.update('eventDate', e.target.value)}
                      className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                      Horário
                    </Label>
                    <Input
                      type="time"
                      value={w.state.eventTime}
                      onChange={(e) => w.update('eventTime', e.target.value)}
                      className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                    Local
                  </Label>
                  <Input
                    value={w.state.eventLocation}
                    onChange={(e) => w.update('eventLocation', e.target.value)}
                    placeholder="Nome do espaço ou endereço"
                    className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white placeholder:text-white/20"
                  />
                </div>

                <button
                  onClick={() => w.update('createCalendarEvent', !w.state.createCalendarEvent)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border transition-all text-left ${
                    w.state.createCalendarEvent
                      ? 'border-white bg-white/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-all ${
                    w.state.createCalendarEvent ? 'border-white bg-white' : 'border-white/30'
                  }`}>
                    {w.state.createCalendarEvent && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wide text-white">
                      Criar evento na agenda
                    </p>
                    <p className="font-mono text-[9px] text-white/40 mt-0.5">
                      O evento será adicionado automaticamente ao calendário
                    </p>
                  </div>
                </button>
              </div>
            )}

            {w.step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">

                  <div className="border border-white/10 p-4">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-white/40 mb-2">
                      Cliente
                    </p>
                    {w.state.clientMode === 'create' ? (
                      <div>
                        <p className="font-mono text-sm text-white">{w.state.newClientName}</p>
                        {w.state.newClientEmail && (
                          <p className="font-mono text-[10px] text-white/40">{w.state.newClientEmail}</p>
                        )}
                        <span className="inline-block mt-1 border border-white/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-white/40">
                          Nova cliente
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="font-mono text-sm text-white">{w.selectedClient?.full_name}</p>
                        {w.selectedClient?.email && (
                          <p className="font-mono text-[10px] text-white/40">{w.selectedClient.email}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border border-white/10 p-4">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-white/40 mb-2">
                      Projeto
                    </p>
                    <p className="font-mono text-sm text-white">{w.state.projectName}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="border border-white/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-white/50">
                        {w.state.eventType}
                      </span>
                      {w.state.budget && (
                        <span className="font-mono text-[9px] text-white/40">
                          R$ {parseFloat(w.state.budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-white/10 p-4">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-white/40 mb-2">
                      Evento
                    </p>
                    {w.state.eventDate ? (
                      <div className="space-y-1">
                        <p className="font-mono text-sm text-white">
                          {format(new Date(w.state.eventDate + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          {w.state.eventTime && ` às ${w.state.eventTime}`}
                        </p>
                        {w.state.eventLocation && (
                          <p className="font-mono text-[10px] text-white/40">{w.state.eventLocation}</p>
                        )}
                        {w.state.createCalendarEvent && (
                          <span className="inline-flex items-center gap-1 border border-white/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-white/50">
                            <Check className="w-2.5 h-2.5" /> Adicionando à agenda
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="font-mono text-[10px] text-white/30">Data não informada</p>
                    )}
                  </div>
                </div>

                {(w.state.clientMode === 'create' ? w.state.newClientEmail : w.selectedClient?.email) && (
                  <button
                    onClick={() => w.update('sendWelcomeEmail', !w.state.sendWelcomeEmail)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border transition-all text-left ${
                      w.state.sendWelcomeEmail ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${
                      w.state.sendWelcomeEmail ? 'border-white bg-white' : 'border-white/30'
                    }`}>
                      {w.state.sendWelcomeEmail && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wide text-white">
                        Enviar email de boas-vindas
                      </p>
                      <p className="font-mono text-[9px] text-white/40 mt-0.5">
                        Envia acesso ao portal para{' '}
                        {w.state.clientMode === 'create' ? w.state.newClientEmail : w.selectedClient?.email}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="px-8 py-5 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={w.step === 0 ? handleDialogClose : w.goBack}
              className="font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {w.step === 0 ? 'Cancelar' : 'Voltar'}
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest">
                {w.step + 1} / {STEP_LABELS.length}
              </span>

              {w.step < 3 ? (
                <Button
                  onClick={w.goNext}
                  disabled={
                    (w.step === 0 && !w.canProceedStep0) ||
                    (w.step === 1 && !w.canProceedStep1) ||
                    (w.step === 2 && !w.canProceedStep2)
                  }
                  className="bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs uppercase tracking-widest gap-1 disabled:opacity-30"
                >
                  Próximo <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={w.handleSubmit}
                  disabled={w.submitting}
                  className="bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs uppercase tracking-widest gap-1 min-w-[140px]"
                >
                  {w.submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Criar Projeto</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
