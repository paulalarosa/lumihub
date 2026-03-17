import { useAuth } from '@/hooks/useAuth'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useIsAdmin } from '@/hooks/useIsAdmin'

export default function AdminRoute() {
  const { user, role, loading } = useAuth()
  const _location = useLocation()

  const isAdmin = useIsAdmin()

  // 1. STRICT LOADING FIRST
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#C0C0C0] animate-spin mb-4" />
        <p className="text-[#C0C0C0] font-light tracking-widest text-sm uppercase">
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
    return <Navigate to="/dashboard" replace />
  }

  // 4. RENDER ADMIN AREA
  return <Outlet />
}
