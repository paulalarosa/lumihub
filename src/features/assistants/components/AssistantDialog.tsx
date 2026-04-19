import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { assistantSchema } from '@/lib/validators'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { logger } from '@/services/logger'
import { Assistant } from '../hooks/useAssistants'

type AssistantFormData = z.infer<typeof assistantSchema>

interface AssistantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assistant: Assistant | null
  onSave: (data: {
    name: string
    email: string | null
    phone: string | null
  }) => Promise<void>
}

export function AssistantDialog({
  open,
  onOpenChange,
  assistant,
  onSave,
}: AssistantDialogProps) {
  const form = useForm<AssistantFormData>({
    resolver: zodResolver(assistantSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (assistant) {
        form.reset({
          name: assistant.full_name,
          email: assistant.email || '',
          phone: assistant.phone || '',
        })
      } else {
        form.reset({
          name: '',
          email: '',
          phone: '',
        })
      }
    }
  }, [assistant, open, form])

  const onSubmit = async (data: AssistantFormData) => {
    try {
      await onSave({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
      })
      onOpenChange(false)
    } catch (error) {
      logger.error(error, 'AssistantDialog.onSubmit')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none bg-[#0A0A0A] border border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif tracking-wide">
            {assistant ? 'Editar Assistente' : 'Nova Assistente'}
          </DialogTitle>
          <p className="text-gray-400 text-xs">
            Insira os dados do profissional parceiro.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs uppercase tracking-wider text-gray-400">
                    Nome *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="NOME COMPLETO"
                      {...field}
                      className="bg-white/5 border-white/10 rounded-none text-white focus:border-white/50 focus:ring-0 placeholder:text-gray-700"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-[10px] font-mono uppercase" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs uppercase tracking-wider text-gray-400">
                    E-mail
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="EMAIL@EXEMPLO.COM"
                      {...field}
                      value={field.value || ''}
                      className="bg-white/5 border-white/10 rounded-none text-white focus:border-white/50 focus:ring-0 placeholder:text-gray-700"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-[10px] font-mono uppercase" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs uppercase tracking-wider text-gray-400">
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 00000-0000"
                      {...field}
                      value={field.value || ''}
                      className="bg-white/5 border-white/10 rounded-none text-white focus:border-white/50 focus:ring-0 placeholder:text-gray-700"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-[10px] font-mono uppercase" />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-none border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/30 uppercase text-xs tracking-wider"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="rounded-none bg-white text-black hover:bg-gray-200 border-none uppercase text-xs tracking-wider font-semibold px-6"
              >
                {form.formState.isSubmitting
                  ? 'Salvando...'
                  : assistant
                    ? 'Salvar'
                    : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
