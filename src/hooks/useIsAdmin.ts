import { useAuth } from '@/hooks/useAuth'

export function useIsAdmin(): boolean {
  const { user, role } = useAuth()
  if (!user) return false
  return role === 'admin' || role === 'super_admin'
}
