import { useAuth } from '@/hooks/useAuth'

// Emails com acesso admin garantido (fallback)
const ADMIN_EMAILS = [
  'prenata@gmail.com',
]

export function useIsAdmin() {
  const { isAdmin, loading, user } = useAuth()
  
  // Fallback: verificar email diretamente caso o role não esteja funcionando
  const isAdminByEmail = ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '')
  
  return { 
    isAdmin: !!isAdmin || isAdminByEmail, 
    isLoading: loading 
  }
}
