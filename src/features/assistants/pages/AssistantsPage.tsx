import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, Users, Shield, UserPlus } from 'lucide-react'
import { AssistantList } from '@/components/features/assistants/AssistantList'
import { InviteAssistantForm } from '@/components/features/assistants/InviteAssistantForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UpgradeCard } from '@/components/features/assistants/UpgradeCard'

export default function AssistantsPage() {
  const { loading: authLoading } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (authLoading)
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-white rounded-full"></div>
      </div>
    )

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      {/* Header - Industrial Noir Style */}
      <header className="border-b border-white/10 bg-[#050505] sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link to="/agenda">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/10 rounded-none text-white h-10 w-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white flex items-center justify-center rounded-none shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  <Users className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl text-white tracking-wide">
                    Equipe
                  </h1>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">
                    Gerenciamento
                  </p>
                </div>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-white text-black hover:bg-gray-200 rounded-none border border-transparent font-semibold uppercase tracking-wider text-xs px-6 h-10 transition-all hover:scale-105 active:scale-95">
                  <UserPlus className="h-4 w-4" />
                  Convidar Assistente
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0A0A0A] border-white/10 text-white rounded-none sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl tracking-wide">
                    Convidar Nova Assistente
                  </DialogTitle>
                </DialogHeader>
                <InviteAssistantForm onSuccess={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid lg:grid-cols-[1fr_320px] gap-8 animate-fade-in">
        <div className="space-y-6">
          <Card className="bg-[#0A0A0A] border-white/5 rounded-none shadow-none">
            <CardHeader className="pb-4 border-b border-white/5">
              <CardTitle className="font-serif text-xl tracking-wide text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-white/70" />
                Controle de Acesso
              </CardTitle>
              <CardDescription className="text-gray-500 font-mono text-xs uppercase tracking-wider">
                Gerencie quem tem acesso à sua agenda e remova permissões quando
                necessário.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <AssistantList />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <UpgradeCard />

            <div className="p-5 border border-white/5 bg-white/[0.02] rounded-none">
              <h4 className="font-bold text-sm mb-3 text-white uppercase tracking-wider border-b border-white/10 pb-2">
                Como funciona?
              </h4>
              <ul className="text-xs text-gray-400 space-y-3 list-none">
                <li className="flex gap-2">
                  <span className="text-white/50">01.</span>
                  <span>
                    Envie um convite por e-mail através do botão acima.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">02.</span>
                  <span>
                    A assistente receberá um link único para criar a conta.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">03.</span>
                  <span>
                    Após o cadastro, ela terá acesso restrito à sua agenda.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">04.</span>
                  <span>
                    Você pode revogar o acesso imediatamente a qualquer momento.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
