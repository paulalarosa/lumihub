import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AIAssistantFAB from './AIAssistantFAB'
import { KhaosAgent } from '@/features/ai/components/KhaosAgent'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Bot } from 'lucide-react'

export default function AIController() {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname

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
    path.startsWith('/assistente')

  const isPublicRoute = !isDashboardRoute

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

  if (
    isPublicRoute &&
    !path.startsWith('/auth') &&
    !path.startsWith('/portal') &&
    !path.startsWith('/b/')
  ) {
    return <AIAssistantFAB />
  }

  return null
}
