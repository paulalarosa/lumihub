import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema } from '@/lib/validators'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, CalendarPlus, Gem } from 'lucide-react'
import { format } from 'date-fns/format'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { sanitizeFormData } from '@/lib/security'

export type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  initialData?: Partial<ClientFormData>
  onSubmit: (data: ClientFormData) => void
  isLoading?: boolean
  submitLabel?: string
}

export function ClientForm({
  initialData,
  onSubmit,
  isLoading,
  submitLabel = 'Salvar',
}: ClientFormProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      notes: initialData?.notes || '',
      is_bride: initialData?.is_bride || false,
      wedding_date: initialData?.wedding_date || undefined,
      access_pin: initialData?.access_pin || '',
      create_event:
        initialData?.create_event !== undefined
          ? initialData.create_event
          : !initialData,
    },
  })

  const handleFormSubmit = (data: ClientFormData) => {
    const cleanData = sanitizeFormData(data)
    onSubmit(cleanData)
  }

  const isBride = form.watch('is_bride')
  const weddingDate = form.watch('wedding_date')
  const isEditing = !!initialData

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs sm:text-[10px] uppercase tracking-widest text-gray-400 font-mono">
                Nome *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome completo"
                  {...field}
                  className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none h-10 font-mono text-sm"
                />
              </FormControl>
              <FormMessage className="text-red-500 text-xs sm:text-[10px] font-mono uppercase" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs sm:text-[10px] uppercase tracking-widest text-gray-400 font-mono">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    {...field}
                    value={field.value || ''}
                    className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none h-10 font-mono text-sm"
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-xs sm:text-[10px] font-mono uppercase" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs sm:text-[10px] uppercase tracking-widest text-gray-400 font-mono">
                  Telefone
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="(00) 00000-0000"
                    {...field}
                    value={field.value || ''}
                    className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none h-10 font-mono text-sm"
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-xs sm:text-[10px] font-mono uppercase" />
              </FormItem>
            )}
          />
        </div>

        <div className="border border-white/10 p-4 bg-white/5 space-y-4">
          <FormField
            control={form.control}
            name="is_bride"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Gem
                    className={cn(
                      'h-4 w-4',
                      field.value ? 'text-white' : 'text-gray-500',
                    )}
                  />
                  <FormLabel className="text-xs uppercase tracking-widest text-white font-mono cursor-pointer">
                    É Noiva? (VIP Portal)
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-zinc-100 data-[state=unchecked]:bg-zinc-800 border-zinc-700"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {isBride && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <FormField
                control={form.control}
                name="wedding_date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs uppercase tracking-widest text-gray-500 font-mono">
                      Data do Casamento
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-normal rounded-none h-12 bg-black border-white/30 text-white hover:bg-white/10 hover:text-white',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto max-w-[calc(100vw-2rem)] p-0 bg-black border-white/20"
                        align="start"
                        side="bottom"
                        avoidCollisions
                      >
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                          className="bg-black text-white"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-red-500 text-xs sm:text-[10px] font-mono uppercase" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="access_pin"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs uppercase tracking-widest text-gray-500 font-mono">
                      PIN de Acesso (4 dígitos)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 4)
                          field.onChange(val)
                        }}
                        className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none h-12 font-mono text-sm tracking-[0.5em] text-center font-bold"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs sm:text-[10px] font-mono uppercase" />
                  </FormItem>
                )}
              />
            </div>
          )}

          {isBride && weddingDate && !isEditing && (
            <FormField
              control={form.control}
              name="create_event"
              render={({ field }) => (
                <FormItem className="flex items-start justify-between gap-3 space-y-0 border-t border-white/10 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-start gap-2 min-w-0">
                    <CalendarPlus
                      className={cn(
                        'h-4 w-4 mt-0.5 flex-shrink-0',
                        field.value ? 'text-white' : 'text-gray-500',
                      )}
                    />
                    <div className="space-y-1">
                      <FormLabel className="text-xs uppercase tracking-widest text-white font-mono cursor-pointer">
                        Criar evento na agenda
                      </FormLabel>
                      <p className="text-[10px] text-white/40 font-mono leading-relaxed">
                        Um compromisso "Casamento — {form.watch('name') || 'noiva'}" é lançado na data selecionada.
                      </p>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-zinc-100 data-[state=unchecked]:bg-zinc-800 border-zinc-700"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs sm:text-[10px] uppercase tracking-widest text-gray-400 font-mono">
                Anotações
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações..."
                  rows={2}
                  {...field}
                  value={field.value || ''}
                  className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none font-mono text-sm resize-none"
                />
              </FormControl>
              <FormMessage className="text-red-500 text-xs sm:text-[10px] font-mono uppercase" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest h-10 mt-2"
        >
          {isLoading ? 'SALVANDO...' : submitLabel}
        </Button>
      </form>
    </Form>
  )
}
