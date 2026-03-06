import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface UpgradeBannerProps {
  professionalName: string
  onContactClick: () => void
}

const UpgradeBanner = ({
  professionalName,
  onContactClick,
}: UpgradeBannerProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40">
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Desbloqueie mais recursos!</p>
              <p className="text-sm opacity-90">
                Peça para {professionalName} fazer upgrade do plano
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={onContactClick}
            className="whitespace-nowrap"
          >
            Falar com {professionalName.split(' ')[0]}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UpgradeBanner
