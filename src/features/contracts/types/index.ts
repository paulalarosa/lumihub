import type { Tables } from '@/integrations/supabase/types'

/**
 * Contract tipado a partir do schema real do DB (`contracts` table).
 * Acresce o campo `clients` quando a query faz join com wedding_clients.
 *
 * Mantido aqui porque o feature/contracts precisa dessa shape com o join.
 * A "fonte da verdade pura" do DB é `src/types/api.types.ts#Contract`.
 */
export type Contract = Tables<'contracts'> & {
  clients?: { name: string } | null
}

export interface Client {
  id: string
  name: string
}
