import { useAuth } from '@/hooks/useAuth'
import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

// Lista de emails com acesso admin
const ADMIN_EMAILS = [
  'prenata@gmail.com',
  'paulalarosa@gmail.com', // Adicione seu email aqui se diferente
]

export default function AdminRoute() {
  const { user, role, loading } = useAuth()

  // Case-insensitive check and email fallback
  const isAdmin = 
    role?.toLowerCase() === 'admin' || 
    role?.toLowerCase() === 'studio' || 
    ADMIN_EMAILS.includes(user?.email || '')

  // 1. STRICT LOADING FIRST
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
        <p className="text-muted-foreground font-light tracking-widest text-sm uppercase">
          Verificando Credenciais...
        </p>
      </div>
    )
  }

  // 2. CHECK USER
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 3. CHECK PERMISSION
  if (!isAdmin) {
    console.warn('[AdminRoute] Access denied for:', user?.email, 'role:', role)
    return <Navigate to="/dashboard" replace />
  }

  // 4. RENDER ADMIN AREA
  return <Outlet />
}
