import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Clock, Loader2 } from 'lucide-react'

export default function UpgradePendingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <Card className="bg-neutral-900 border-neutral-800 p-12 text-center max-w-md w-full">
        {/* Pending Icon */}
        <div className="w-24 h-24 bg-yellow-500/10 border-2 border-yellow-500/50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <Clock className="w-12 h-12 text-yellow-500" />
          <Loader2 className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-spin" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Pagamento Pendente
        </h1>

        {/* Message */}
        <p className="text-neutral-400 mb-8">
          Seu pagamento está sendo processado. Isso geralmente acontece com
          boletos ou PIX que ainda não foram confirmados.
        </p>

        {/* Info */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-white font-semibold mb-4">Próximos passos:</h3>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li>
              • <strong>Boleto:</strong> Pode levar até 2 dias úteis
            </li>
            <li>
              • <strong>PIX:</strong> Confirmação em até 1 hora
            </li>
            <li>• Você receberá um email quando for aprovado</li>
            <li>• Sua conta será ativada automaticamente</li>
          </ul>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={() => navigate('/assistant/dashboard')}
          className="w-full bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-wider"
        >
          Voltar ao Dashboard
        </Button>

        <p className="text-neutral-500 text-xs mt-6">
          Você pode acompanhar o status do pagamento no seu email
        </p>
      </Card>
    </div>
  )
}
