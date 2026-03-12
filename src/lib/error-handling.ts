import { logger } from '@/services/logger'

interface SupabaseResult<T> {
  data: T | null
  error: { message: string; code?: string; details?: string } | null
}

export function assertSupabaseResult<T>(
  result: SupabaseResult<T>,
  context: string,
): T {
  if (result.error) {
    logger.error(`[${context}] ${result.error.message}`, result.error, 'SYSTEM')
    throw new Error(result.error.message)
  }
  return result.data as T
}

export async function safeAsync<T>(
  fn: () => Promise<T>,
  context: string,
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    logger.error(
      `[${context}] Operação falhou`,
      error instanceof Error ? error : new Error(String(error)),
      'SYSTEM',
    )
    return null
  }
}

export function isSupabaseError(
  result: SupabaseResult<unknown>,
): result is SupabaseResult<never> & {
  error: NonNullable<SupabaseResult<never>['error']>
} {
  return result.error !== null
}

import { toast } from 'sonner'

export interface ErrorHandleOptions {
  showToast?: boolean
}

/**
 * Universal Error Handler for UI Components
 * 1. Logs locally for dev debugging
 * 2. Tracks silently via Sentry for prod monitoring
 * 3. Shows friendly UI Toast to the user (optional)
 */
export const handleError = (
  error: Error | unknown,
  context: string,
  options: ErrorHandleOptions = {},
) => {
  const { showToast = true } = options

  // 1 & 2. Log and Track (logger.error already handles Dev Console + Sentry + DB)
  logger.error(
    error instanceof Error ? error : new Error(String(error)),
    `[${context}]`,
    'SYSTEM',
  )

  // 3. Feedback ao usuário via Toast do Sonner (opcional)
  if (showToast) {
    const message =
      error instanceof Error
        ? error.message
        : 'Ocorreu um erro interno inesperado.'
    toast.error(message, {
      description: `Referência do erro: ${context}`,
    })
  }
}
