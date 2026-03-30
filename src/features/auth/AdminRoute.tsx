import { Navigate, Outlet } from 'react-router-dom'
import { useIsAdmin } from '@/hooks/useIsAdmin'

export function AdminRoute() {
  const { isAdmin, isLoading } = useIsAdmin()

  if (isLoading) return null
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return <Outlet />
}

export default AdminRoute
