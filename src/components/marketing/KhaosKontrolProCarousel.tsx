import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Sparkles,
  TrendingUp,
  MapPin,
  Users,
  Crown,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface Slide {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const slides: Slide[] = [
  {
    icon: Sparkles,
    title: 'KONTROL: A Sua Nova Fase Profissional',
    description:
      'Eleve seu posicionamento no mercado com o KONTROL. Saia do suporte e assuma o controle da sua carreira com as ferramentas de gestão mais modernas do mundo da beleza.',
  },
  {
    icon: TrendingUp,
    title: 'Gestão de Ganhos em Tempo Real',
    description:
      'Tenha um painel financeiro completo para acompanhar suas comissões, recebimentos e histórico. Segurança e clareza para você focar no que importa: sua arte.',
  },
  {
    icon: MapPin,
    title: 'Agendamento Inteligente e GPS',
    description:
      'Libere sua própria agenda KONTROL. Seus clientes agendam, o endereço é validado via Google Maps e você recebe a rota direta para o seu app de GPS favorito.',
  },
  {
    icon: Users,
    title: 'Networking de Elite',
    description:
      'Mantenha suas conexões com as melhores maquiadoras, mas agora com um perfil Pro. Mais autoridade para ser tagueada nos maiores eventos do mercado.',
  },
  {
    icon: Crown,
    title: 'Desbloqueie o KONTROL PRO',
    description:
      'Transforme sua rotina com acesso ilimitado a todas as funções premium. Clique abaixo e faça seu upgrade para o Plano Pro hoje mesmo!',
  },
]

export const KhaosKontrolProCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Carousel
        opts={{
          align: 'center',
          loop: true,
        }}
        className="w-full"
        setApi={(api) => {
          api?.on('select', () => {
            setCurrentSlide(api.selectedScrollSnap())
          })
        }}
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="p-4"
              >
                <div className="relative bg-black border border-white/20 p-12 aspect-[16/9] flex flex-col justify-center items-center text-center group">
                  {/* Corner Markers - Viewfinder Effect */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-white" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-white" />

                  {/* Icon / Play Button Placeholder */}
                  <div className="mb-8 relative">
                    <div className="w-20 h-20 rounded-full border border-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <slide.icon className="h-8 w-8 text-white stroke-[1]" />
                    </div>
                  </div>

                  <div className="space-y-6 max-w-2xl mx-auto">
                    <h3 className="font-serif text-3xl md:text-4xl text-white tracking-tight">
                      {slide.title}
                    </h3>
                    <p className="font-mono text-sm text-gray-400 leading-relaxed max-w-lg mx-auto">
                      {slide.description}
                    </p>
                  </div>

                  {index === slides.length - 1 && (
                    <div className="mt-10">
                      <Link to="/planos">
                        <Button
                          size="lg"
                          className="bg-white text-black hover:bg-gray-200 rounded-none px-8 py-6 font-mono text-xs uppercase tracking-widest"
                        >
                          Fazer Upgrade Agora
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Technical Label */}
                  <div className="absolute bottom-4 right-4 font-mono text-[10px] text-white/30">
                    SEQ.0{index + 1} // KONTROL_PRO_MODULE
                  </div>
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="flex items-center justify-center mt-12 gap-8">
          <CarouselPrevious className="static translate-y-0 bg-transparent border border-white/20 text-white hover:bg-white hover:text-black rounded-none h-10 w-10" />

          {/* Technical Progress Bar */}
          <div className="flex items-center gap-1">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-1 transition-all duration-300 ${
                  currentSlide === index ? 'w-8 bg-white' : 'w-4 bg-white/20'
                }`}
              />
            ))}
          </div>

          <CarouselNext className="static translate-y-0 bg-transparent border border-white/20 text-white hover:bg-white hover:text-black rounded-none h-10 w-10" />
        </div>
      </Carousel>
    </div>
  )
}
