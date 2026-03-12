import { z } from 'zod'

export const emailSchema = z.string().email('Email inválido')

export const phoneSchema = z
  .string()
  .min(10, 'Telefone muito curto')
  // Brazilian format: (11) 99999-9999 or 11999999999
  .regex(/^[\d\s()+-]+$/, 'Formato de telefone inválido')

export const pinSchema = z
  .string()
  .min(4, 'PIN deve ter pelo menos 4 dígitos')
  .max(6, 'PIN deve ter no máximo 6 dígitos')
  .regex(/^\d+$/, 'PIN deve conter apenas números')

export const clientSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z
    .string()
    .min(10, 'Telefone muito curto')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
  is_bride: z.boolean().default(false).optional(),
  wedding_date: z.date().optional().nullable(),
  access_pin: z
    .string()
    .optional()
    .or(z.literal(''))
    .superRefine((val, ctx) => {
      if (val && !/^\d{4}$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'PIN deve ter exatamente 4 dígitos numéricos',
        })
      }
    }),
})

export const bookingSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  date: z.date({ required_error: 'Data é obrigatória' }),
  service_type: z.string().min(1, 'Selecione um serviço'),
})

export const transactionSchema = z.object({
  description: z.string().min(2, 'Descrição é muito curta'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  payment_method: z.string().min(1, 'Método de pagamento é obrigatório'),
  project_id: z.string().optional().nullable(),
  service_id: z.string().optional().nullable(),
  assistant_id: z.string().optional().nullable(),
})

export const assistantSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z
    .string()
    .min(10, 'Telefone muito curto')
    .optional()
    .or(z.literal('')),
})

// Legacy helpers (can be upgraded later)
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success
}

export function validatePin(pin: string): boolean {
  return pinSchema.safeParse(pin).success
}

export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success
}
