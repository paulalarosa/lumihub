import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import { useTransactionForm } from '@/hooks/useTransactionForm'

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'income' | 'expense'
  onSuccess?: () => void
}

const CATEGORIES = {
  income: [
    { value: 'Service', label: 'Serviço' },
    { value: 'Product', label: 'Produto' },
    { value: 'Consulting', label: 'Consultoria' },
    { value: 'Other', label: 'Outro' },
  ],
  expense: [
    { value: 'Rent', label: 'Aluguel' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Equipment', label: 'Equipamentos' },
    { value: 'Supplies', label: 'Suprimentos / Produtos' },
    { value: 'Utilities', label: 'Contas (Luz, Água, Net)' },
    { value: 'Salary', label: 'Salários' },
    { value: 'Tax', label: 'Impostos' },
    { value: 'Other', label: 'Outro' },
  ],
}

const PAYMENT_METHODS = [
  { value: 'pix', label: 'Pix' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'transfer', label: 'Transferência Bancária' },
  { value: 'other', label: 'Outro' },
]

export default function TransactionDialog({
  open,
  onOpenChange,
  type,
  onSuccess,
}: TransactionDialogProps) {
  const { form, options, handleAmountChange, onSubmit } = useTransactionForm({
    open,
    type,
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#050505] border border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {type === 'income' ? 'Nova Receita' : 'Nova Despesa'}
          </DialogTitle>
          <p className="text-gray-400 text-sm">
            Preencha os dados da transação financeira.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Corte de Cabelo"
                      {...field}
                      className="bg-white/5 border-white/10 focus:border-white/50"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-[10px] font-mono uppercase" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          handleAmountChange(e)
                        }}
                        className="bg-white/5 border-white/10 focus:border-white/50 font-mono"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-[10px] font-mono uppercase" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-white/5 border-white/10 focus:border-white/50"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-[10px] font-mono uppercase" />
                  </FormItem>
                )}
              />
            </div>

            {type === 'income' && (
              <div className="space-y-4 border-t border-white/10 pt-4 mt-2">
                <FormField
                  control={form.control}
                  name="project_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Vincular a Projeto (Noiva)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                            <SelectValue placeholder="Selecione o Projeto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                          {options.projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-[10px] font-mono uppercase" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="service_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Serviço Dedicado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                            <SelectValue placeholder="Selecione o Serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                          {options.services.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-[10px] font-mono uppercase" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assistant_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Assistente Responsável (Opcional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                          {options.assistants.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.full_name || 'Sem nome'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-[10px] font-mono uppercase" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                        {CATEGORIES[type].map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500 text-[10px] font-mono uppercase" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Método de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500 text-[10px] font-mono uppercase" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-white/60 hover:text-white hover:bg-white/5"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className={`text-black ${
                  type === 'income'
                    ? 'bg-emerald-400 hover:bg-emerald-500'
                    : 'bg-red-400 hover:bg-red-500'
                }`}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar {type === 'income' ? 'Receita' : 'Despesa'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
