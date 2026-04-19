import { useAuth } from '@/hooks/useAuth'

const ADMIN_EMAILS = [
  'prenata@gmail.com',
]

export function useIsAdmin() {
  const { isAdmin, loading, user } = useAuth()

  const isAdminByEmail = ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '')

  const isActuallyAdmin = !!isAdmin || isAdminByEmail

  return {
    isAdmin: isActuallyAdmin,
    isLoading: loading
  }
}
