import { useAuth } from '@/hooks/useAuth'
import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const ADMIN_EMAILS = [
  'prenata@gmail.com',
  'paulalarosa@gmail.com',
]

export default function AdminRoute() {
  const { user, role, loading } = useAuth()

  const isAdmin =
    role?.toLowerCase() === 'admin' ||
    role?.toLowerCase() === 'studio' ||
    ADMIN_EMAILS.includes(user?.email || '')

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

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
