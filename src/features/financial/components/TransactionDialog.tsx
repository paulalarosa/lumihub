import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { useLanguage } from '@/hooks/useLanguage'

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
  const { t } = useLanguage()
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
            {type === 'income'
              ? t('transactions.dialog.title_income')
              : t('transactions.dialog.title_expense')}
          </DialogTitle>
          <p className="text-gray-400 text-sm">
            {t('transactions.dialog.subtitle')}
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
                  <FormLabel>{t('transactions.form.description_label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('transactions.form.description_placeholder')}
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
                    <FormLabel>{t('transactions.form.amount_label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('transactions.form.amount_placeholder')}
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
                    <FormLabel>{t('transactions.form.date_label')}</FormLabel>
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
                      <FormLabel>{t('transactions.form.project_label')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                            <SelectValue placeholder={t('transactions.form.project_placeholder')} />
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
                      <FormLabel>{t('transactions.form.service_label')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                            <SelectValue placeholder={t('transactions.form.service_placeholder')} />
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
                      <FormLabel>{t('transactions.form.assistant_label')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                            <SelectValue placeholder={t('transactions.form.assistant_placeholder')} />
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
                    <FormLabel>{t('transactions.form.category_label')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                          <SelectValue placeholder={t('transactions.form.select_placeholder')} />
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
                    <FormLabel>{t('transactions.form.payment_method_label')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                          <SelectValue placeholder={t('transactions.form.select_placeholder')} />
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
                {t('transactions.cancel')}
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
                {type === 'income'
                  ? t('transactions.save_income')
                  : t('transactions.save_expense')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
