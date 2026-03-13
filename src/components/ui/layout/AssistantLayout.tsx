import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { PageLoader } from '@/components/ui/LoadingStates'

export default function AssistantLayout() {
  const { signOut } = useAuth()
  const { isAssistant, loading } = useRole()

  // If checking role, show loader
  if (loading) return <PageLoader />

  // If not assistant, redirect or show error?
  // ProtectedRoute usually handles this, but layout can enforce too.
  if (!isAssistant) return <Navigate to="/" replace /> // Or to a specific error page.

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border p-4 flex justify-between items-center bg-card shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">
            Portal da Assistente
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </nav>
      <main className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
