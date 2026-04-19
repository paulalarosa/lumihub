import { useAuth } from '@/hooks/useAuth'

export const ADMIN_EMAILS = [
  'prenata@gmail.com',
  'paulalarosa@gmail.com',
  'paula.larosa@klinisaude.com.br',
]

export function useIsAdmin() {
  const { isAdmin, loading, user } = useAuth()

  const isAdminByEmail = ADMIN_EMAILS.includes(
    user?.email?.toLowerCase() ?? '',
  )

  return {
    isAdmin: !!isAdmin || isAdminByEmail,
    isLoading: loading,
  }
}
