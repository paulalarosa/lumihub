import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { transactionSchema } from '@/lib/validators'
import * as z from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { toast } from 'sonner'
import { format } from 'date-fns/format'

import { Logger, logger } from '@/services/logger'

export type TransactionFormData = z.infer<typeof transactionSchema>

interface UseTransactionFormProps {
  open: boolean
  type: 'income' | 'expense'
  onSuccess?: () => void
  onOpenChange: (open: boolean) => void
}

export function useTransactionForm({
  open,
  type,
  onSuccess,
  onOpenChange,
}: UseTransactionFormProps) {
  const { user } = useAuth()
  const { organizationId } = useOrganization()

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: '',
      category: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'pix',
      project_id: '',
      service_id: '',
      assistant_id: '',
    },
  })

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [services, setServices] = useState<{ id: string; name: string }[]>([])
  const [assistants, setAssistants] = useState<
    { id: string; full_name: string | null }[]
  >([])

  useEffect(() => {
    if (open && user) {
      fetchOptions()
    }
  }, [open, user])

  useEffect(() => {
    if (open) {
      form.reset({
        description: '',
        amount: '',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: 'pix',
        project_id: '',
        service_id: '',
        assistant_id: '',
      })
    }
  }, [open, form])

  const fetchOptions = async () => {
    try {
      if (!organizationId) return

      const { data: p } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', organizationId)
      if (p) setProjects(p)

      const { data: s } = await supabase
        .from('services')
        .select('id, name')
        .eq('user_id', organizationId)
      if (s) setServices(s)

      const { data: ma } = await supabase
        .from('makeup_artists')
        .select('id')
        .eq('user_id', organizationId)
        .maybeSingle()

      if (ma) {
        const { data: accessData } = await supabase
          .from('assistant_access')
          .select('assistant:assistants(id, full_name)')
          .eq('makeup_artist_id', ma.id)
          .eq('status', 'active')

        if (accessData) {
          const formattedAssistants = accessData
            .map((item: any) => item.assistant)
            .filter(Boolean)
          setAssistants(formattedAssistants)
        }
      }
    } catch (error) {
      logger.error(error, {
        message: 'Erro ao carregar opções de formulário.',
        showToast: false,
      })
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (!value) {
      form.setValue('amount', '')
      return
    }
    const numericValue = (Number(value) / 100).toFixed(2)
    let formattedValue = numericValue.replace('.', ',')
    formattedValue = formattedValue.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
    form.setValue('amount', `R$ ${formattedValue}`, { shouldValidate: true })
  }

  const onSubmit = async (data: TransactionFormData) => {
    if (!user || !organizationId) return

    try {
      const amountValue = parseFloat(
        data.amount.replace('R$ ', '').replace(/\./g, '').replace(',', '.'),
      )

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: organizationId,
          type: type,
          description: data.description,
          amount: amountValue,
          category: data.category,
          date: data.date,
          payment_method: data.payment_method,
          project_id: data.project_id || null,
          service_id: data.service_id || null,
          assistant_id: data.assistant_id || null,
        })
        .select()
        .single()

      if (error) throw error

      if (transaction) {
        Logger.action(
          'FINANCIAL_TRANSACTION_CREATE',
          user.id,
          'transactions',
          transaction.id,
          {
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
          },
        )
      }

      toast.success(
        `${type === 'income' ? 'Receita' : 'Despesa'} registrada com sucesso!`,
      )
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error(error, {
        message: 'Erro ao salvar transação. Tente novamente.',
      })
    }
  }

  return {
    form,
    options: { projects, services, assistants },
    handleAmountChange,
    onSubmit,
  }
}
