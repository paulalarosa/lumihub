import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export type UsageResource = 'clients' | 'projects' | 'team_members'

interface UsageResult {
  allowed: boolean
  used?: number
  limit?: number | null
  remaining?: number
  unlimited?: boolean
  reason?: string
}

const RESOURCE_LABEL: Record<UsageResource, { single: string; plural: string }> = {
  clients: { single: 'cliente', plural: 'clientes' },
  projects: { single: 'projeto neste mês', plural: 'projetos neste mês' },
  team_members: { single: 'assistente', plural: 'assistentes' },
}

export class UsageLimitError extends Error {
  resource: UsageResource
  used: number
  limit: number | null

  constructor(resource: UsageResource, used: number, limit: number | null) {
    super(`Usage limit reached for ${resource}: ${used}/${limit}`)
    this.name = 'UsageLimitError'
    this.resource = resource
    this.used = used
    this.limit = limit
  }
}

/**
 * Checa limite de uso via RPC do Postgres. Throw UsageLimitError se
 * atingiu o limite — caller pode capturar e mostrar UI de upgrade.
 *
 * Nunca falha silenciosamente: erros de rede passam e a mutation
 * continua (fail-open). Limite é apenas defesa em camadas — RLS no DB
 * deve ser a barreira real.
 */
export async function ensureWithinUsageLimit(
  userId: string,
  resource: UsageResource,
): Promise<void> {
  const { data, error } = await supabase.rpc('check_usage_limit', {
    p_user_id: userId,
    p_resource: resource,
  })

  if (error) return
  const result = data as UsageResult | null
  if (!result) return
  if (result.allowed) return

  throw new UsageLimitError(
    resource,
    result.used ?? 0,
    result.limit ?? null,
  )
}

/**
 * Mostra toast com CTA de upgrade quando o limite foi atingido.
 * Caller passa `onUpgrade` (geralmente navigate('/configuracoes/assinatura')).
 */
export function showUsageLimitToast(
  err: UsageLimitError,
  onUpgrade: () => void,
): void {
  const label = RESOURCE_LABEL[err.resource]
  const limitStr = err.limit != null ? `${err.used}/${err.limit}` : `${err.used}`
  toast.error(`Limite de ${label.plural} atingido (${limitStr})`, {
    description:
      'Faça upgrade pra desbloquear o uso ilimitado e continuar crescendo.',
    duration: 10_000,
    action: {
      label: 'Fazer upgrade',
      onClick: onUpgrade,
    },
  })
}
