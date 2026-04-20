import SEOHead from '@/components/seo/SEOHead'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function UpgradeSuccessPage() {
  const navigate = useNavigate()

  useEffect(() => {
    toast.success('Pagamento aprovado! Bem-vinda ao Khaos Kontrol PRO!', {
      duration: 5000,
    })
  }, [])

  const handleContinue = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <SEOHead title="Pagamento Confirmado" noindex={true} />
      <Card className="bg-neutral-900 border-neutral-800 p-12 text-center max-w-md w-full">
        {}
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-black" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
        </div>

        {}
        <h1 className="text-3xl font-bold text-white mb-4">
          Pagamento Aprovado!
        </h1>

        {}
        <p className="text-neutral-400 mb-8">
          Sua conta foi ativada com sucesso. Agora você tem acesso completo a
          todas as funcionalidades da plataforma Khaos Kontrol PRO.
        </p>

        {}
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-white font-semibold mb-4 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Recursos Desbloqueados
          </h3>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />
              Agenda ilimitada
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />
              Gestão de clientes
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />
              Contratos digitais
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />
              Financeiro completo
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />
              Portal da Noiva
            </li>
          </ul>
        </div>

        {}
        <Button
          size="lg"
          onClick={handleContinue}
          className="w-full bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-wider"
        >
          Ir para o Dashboard
        </Button>

        <p className="text-neutral-500 text-xs mt-4">
          Um email de confirmação foi enviado para você
        </p>
      </Card>
    </div>
  )
}
