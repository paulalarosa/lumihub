import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AIAssistantFAB from './AIAssistantFAB'
import { KhaosAgent } from '@/features/ai/components/KhaosAgent'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/Button'
import { Bot } from 'lucide-react'

export default function AIController() {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname

  // Define routes
  const isDashboardRoute =
    path.startsWith('/dashboard') ||
    path.startsWith('/admin') ||
    path.startsWith('/clientes') ||
    path.startsWith('/projetos') ||
    path.startsWith('/configuracoes') ||
    path.startsWith('/agenda') ||
    path.startsWith('/assistentes') ||
    path.startsWith('/servicos') ||
    path.startsWith('/contratos') ||
    path.startsWith('/marketing') ||
    path.startsWith('/assistente') // Portal assistente

  const isPublicRoute = !isDashboardRoute

  // 1. Internal AI (Lumi IA)
  // Render if authenticated and inside the internal area/dashboard
  if (user && isDashboardRoute) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-none bg-white text-black shadow-2xl hover:bg-zinc-200 z-50 border border-black group">
            <Bot className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="p-0 w-full sm:max-w-[450px] border-l border-white/10 bg-black"
        >
          <KhaosAgent />
        </SheetContent>
      </Sheet>
    )
  }

  // 2. Sales AI (Lumi Assistant)
  // Render only on public routes.
  // If user is logged in but on public page (e.g. Home), we could still show it,
  // or hide it. The requirement says: "If the user is logged in and inside the dashboard, this assistant should be hidden."
  // It implies if logged in and on Home, it might be visible, OR we can hide it if logged in generally to avoid confusion.
  // However, "Only render this component if the current path is public" is the primary rule.
  if (
    isPublicRoute &&
    !path.startsWith('/auth') &&
    !path.startsWith('/portal') &&
    !path.startsWith('/b/')
  ) {
    // Exclude Auth pages, Client Portal and Public Booking from Sales Bot to avoid clutter?
    // Requirement: "e.g., '/', '/login', '/pricing'"
    return <AIAssistantFAB />
  }

  return null
}
