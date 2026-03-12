import { Button } from '@/components/ui/Button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { NoirDatePicker } from '@/components/ui/noir-date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Clock,
  MapPin,
  Trash2,
  Save,
  Loader2,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useEventDetailsSidebar,
  type SidebarEvent,
} from './hooks/useEventDetailsSidebar'

interface EventDetailsSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: SidebarEvent | null
  onEdit: (event: SidebarEvent) => void
  onDelete: (eventId: string) => void
  userRole: 'admin' | 'assistant' | 'viewer'
}

export function EventDetailsSidebar({
  open,
  onOpenChange,
  event: initialEvent,
  onEdit,
  onDelete,
  userRole,
}: EventDetailsSidebarProps) {
  const s = useEventDetailsSidebar({
    open,
    initialEvent,
    onEdit,
    onDelete,
    onOpenChange,
    userRole,
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-[400px] sm:w-[540px] flex flex-col p-0 gap-0 bg-background border-l shadow-2xl"
        side="right"
      >
        <SheetHeader className="px-6 py-4 border-b flex flex-row items-center justify-between sticky top-0 bg-background z-10">
          <SheetTitle className="text-xl font-semibold">
            Editar Evento
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {s.fetchingDetail ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Título do Evento
                  </Label>
                  <Input
                    id="title"
                    value={s.title}
                    onChange={(e) => s.setTitle(e.target.value)}
                    placeholder="Ex: Casamento Maria & João"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client" className="text-sm font-medium">
                    Cliente Principal
                  </Label>
                  <Select
                    value={s.clientId || ''}
                    onValueChange={s.setClientId}
                  >
                    <SelectTrigger id="client" className="h-10">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {s.clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data</Label>
                    <NoirDatePicker
                      date={s.eventDate}
                      setDate={s.setEventDate}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Início</Label>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="time"
                          value={s.startTime}
                          onChange={(e) => s.setStartTime(e.target.value)}
                          className="pl-9 h-10 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Fim</Label>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="time"
                          value={s.endTime}
                          onChange={(e) => s.setEndTime(e.target.value)}
                          className="pl-9 h-10 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Localização
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="location"
                      value={s.location}
                      onChange={(e) => s.setLocation(e.target.value)}
                      placeholder="Endereço ou nome do local"
                      className="pl-9 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Equipe / Assistentes
                  </Label>
                  <Popover
                    open={s.openAssistantCombobox}
                    onOpenChange={s.setOpenAssistantCombobox}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={s.openAssistantCombobox}
                        className="w-full justify-between h-auto min-h-[2.5rem] py-2"
                      >
                        <div className="flex flex-wrap gap-1">
                          {s.selectedAssistants.length > 0 ? (
                            s.selectedAssistants.map((id) => {
                              const assistant = s.availableAssistants.find(
                                (a) => a.id === id,
                              )
                              return assistant ? (
                                <Badge
                                  key={id}
                                  variant="secondary"
                                  className="mr-1 mb-1"
                                >
                                  {assistant.name}
                                </Badge>
                              ) : null
                            })
                          ) : (
                            <span className="text-muted-foreground font-normal">
                              Selecione assistentes...
                            </span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar assistente..." />
                        <CommandList>
                          <CommandEmpty>
                            Nenhum assistente encontrado.
                          </CommandEmpty>
                          <CommandGroup>
                            {s.availableAssistants.map((assistant) => (
                              <CommandItem
                                key={assistant.id}
                                value={assistant.name}
                                onSelect={() => s.toggleAssistant(assistant.id)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    s.selectedAssistants.includes(assistant.id)
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                                {assistant.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notas Internas
                  </Label>
                  <Textarea
                    id="notes"
                    value={s.notes}
                    onChange={(e) => s.setNotes(e.target.value)}
                    placeholder="Detalhes logísticos, lembretes, etc."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-background mt-auto flex items-center justify-between sm:justify-between sm:space-x-0">
          <Button
            variant="ghost"
            onClick={s.handleDelete}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            disabled={s.saving}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={s.saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={s.handleSave}
              disabled={s.saving}
              className="min-w-[100px]"
            >
              {s.saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
