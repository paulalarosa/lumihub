import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 text-[#FFFFFF] animate-spin mb-4" />
        <p className="text-[#FFFFFF] font-mono text-[10px] uppercase tracking-[0.3em]">
          Authenticating...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
