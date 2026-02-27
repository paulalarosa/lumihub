import { z } from 'zod'

export const emailSchema = z.string().email('Email inválido')

export const pinSchema = z
  .string()
  .min(4, 'PIN deve ter pelo menos 4 dígitos')
  .max(6, 'PIN deve ter no máximo 6 dígitos')
  .regex(/^\d+$/, 'PIN deve conter apenas números')

export const phoneSchema = z
  .string()
  .min(10, 'Telefone inválido')
  .regex(/^[\d\s()+-]+$/, 'Formato de telefone inválido')

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success
}

export function validatePin(pin: string): boolean {
  return pinSchema.safeParse(pin).success
}

export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success
}
