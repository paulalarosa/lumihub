export const ERROR_MESSAGES = {
  NETWORK: 'Sem conexão com internet. Verifique sua rede e tente novamente.',
  PERMISSION: 'Você não tem permissão para realizar esta ação.',
  VALIDATION: 'Preencha todos os campos obrigatórios corretamente.',
  CONFLICT: 'Este registro já está cadastrado ou existe um conflito de dados.',
  NOT_FOUND: 'Recurso não encontrado.',
  AUTH_INVALID_CREDENTIALS: 'Email ou senha inválidos.',
  AUTH_USER_EXISTS: 'Este email já está cadastrado.',
  UNKNOWN: 'Erro inesperado. Tente novamente em alguns segundos.',
}

export const SUPABASE_ERROR_CODES = {
  PGRST116: ERROR_MESSAGES.NOT_FOUND,
  '23505': ERROR_MESSAGES.CONFLICT,
  '23503': ERROR_MESSAGES.CONFLICT,
  '42501': ERROR_MESSAGES.PERMISSION,
}

export interface ErrorDetails {
  title: string
  description: string
}

export function getErrorMessage(
  error: any,
  defaultTitle = 'Erro',
): ErrorDetails {
  if (!error)
    return { title: defaultTitle, description: ERROR_MESSAGES.UNKNOWN }

  let description = ERROR_MESSAGES.UNKNOWN
  const message = error.message?.toLowerCase() || ''
  const code = error.code || error.status

  // 1. Handle explicit Supabase/PostgREST codes
  if (code && SUPABASE_ERROR_CODES[code as keyof typeof SUPABASE_ERROR_CODES]) {
    description =
      SUPABASE_ERROR_CODES[code as keyof typeof SUPABASE_ERROR_CODES]
  }
  // 2. Handle Auth specific messages
  else if (message.includes('invalid login credentials')) {
    description = ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS
  } else if (message.includes('user already exists')) {
    description = ERROR_MESSAGES.AUTH_USER_EXISTS
  }
  // 3. Handle patterns
  else if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch')
  ) {
    description = ERROR_MESSAGES.NETWORK
  } else if (
    message.includes('duplicate') ||
    message.includes('already exists')
  ) {
    description = ERROR_MESSAGES.CONFLICT
  } else if (
    message.includes('permission') ||
    message.includes('denied') ||
    message.includes('unauthorized')
  ) {
    description = ERROR_MESSAGES.PERMISSION
  } else if (error.message) {
    description = error.message
  }

  return { title: defaultTitle, description }
}
