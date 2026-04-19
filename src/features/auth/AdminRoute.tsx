import { useAuth } from '@/hooks/useAuth'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export default function AdminRoute() {
  const { user, loading } = useAuth()
  const { isAdmin, isLoading: adminLoading } = useIsAdmin()

  if (loading || adminLoading) {
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
