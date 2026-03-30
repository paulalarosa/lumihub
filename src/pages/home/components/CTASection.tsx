import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export const CTASection = () => {
  const navigate = useNavigate()

  return (
    <section className="py-32 bg-black relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-3xl">

        {/* StoryBrand: Fracasso (o que acontece se NÃO agir) */}
        <p className="text-white/30 text-xs font-mono uppercase tracking-[0.2em] mb-6 text-center">
          A cada semana sem sistema
        </p>

        <h2 className="text-4xl md:text-6xl font-serif text-white text-center leading-tight mb-6 tracking-tight">
          Você perde clientes que{' '}
          <span className="italic text-white/60">nunca mais voltam.</span>
        </h2>

        {/* StoryBrand: Sucesso (o que acontece se agir) */}
        <p className="text-white/40 text-center text-base md:text-lg mb-12 max-w-xl mx-auto leading-relaxed">
          Profissionais que usam o Khaos Kontrol fecham mais contratos,
          nunca esquecem um follow-up, e têm clientes que indicam.
        </p>

        {/* CTA direto */}
        <div className="flex flex-col items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            className="px-12 group"
            onClick={() => navigate('/cadastro')}
          >
            Começar grátis por 14 dias
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-xs text-white/25">
            Sem cartão de crédito. Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  )
}
