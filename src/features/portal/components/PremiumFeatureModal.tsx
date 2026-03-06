import { Check, Lock, MessageCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'

interface PremiumFeatureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName: string
  professionalName: string
  professionalPhone?: string
}

const PremiumFeatureModal = ({
  open,
  onOpenChange,
  featureName,
  professionalName,
  professionalPhone,
}: PremiumFeatureModalProps) => {
  const features = [
    {
      name: 'Acesso a dados de clientes',
      included: featureName === 'Clientes',
    },
    { name: 'Visualização de valores', included: featureName === 'Financeiro' },
    {
      name: 'Relatórios de performance',
      included: featureName === 'Relatórios',
    },
    { name: 'Chat integrado', included: false },
    { name: 'Notificações push', included: false },
  ]

  const handleWhatsAppContact = () => {
    if (professionalPhone) {
      const phone = professionalPhone.replace(/\D/g, '')
      const message = encodeURIComponent(
        `Olá ${professionalName}! Gostaria de saber mais sobre os recursos premium do portal de assistentes.`,
      )
      window.open(`https://wa.me/55${phone}?text=${message}`, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {featureName === 'premium' ? 'Recursos Premium' : `${featureName}`}
          </DialogTitle>
          <DialogDescription className="text-center">
            Este recurso está disponível apenas para contas premium. Entre em
            contato com {professionalName} para fazer upgrade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Plano Premium</span>
              <Badge variant="secondary">Recomendado</Badge>
            </div>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span className={feature.included ? 'font-medium' : ''}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            {professionalPhone && (
              <Button onClick={handleWhatsAppContact} className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar com {professionalName.split(' ')[0]} no WhatsApp
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Voltar ao Portal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PremiumFeatureModal
