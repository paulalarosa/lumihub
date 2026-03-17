import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export const CTASection = () => {
  const navigate = useNavigate()

  return (
    <section className="py-40 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl -z-10" />
      <div className="container mx-auto px-6 text-center max-w-4xl">
        <h2 className="text-5xl md:text-8xl font-bold text-white mb-8 tracking-tighter font-serif">
          DOMINE O{' '}
          <span className="italic font-normal text-white/70">KHAOS</span>
        </h2>
        <p className="text-white/40 text-lg mb-12 font-mono uppercase tracking-[0.2em] max-w-2xl mx-auto">
          Não é sobre trabalhar mais. É sobre ter kontrole absoluto sobre o que
          você cria.
        </p>
        <Button
          variant="primary"
          size="lg"
          className="px-16"
          onClick={() => navigate('/cadastro')}
        >
          INICIAR_SISTEMA_AGORA
        </Button>
      </div>
    </section>
  )
}
