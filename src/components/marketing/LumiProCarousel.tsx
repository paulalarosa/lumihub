import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { 
  Sparkles, 
  TrendingUp, 
  MapPin, 
  Users, 
  Crown,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Slide {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
}

const slides: Slide[] = [
  {
    icon: Sparkles,
    title: "Lumi: A Sua Nova Fase Profissional",
    description: "Eleve seu posicionamento no mercado com a Lumi. Saia do suporte e assuma o controle da sua carreira com as ferramentas de gestão mais modernas do mundo da beleza.",
    gradient: "from-primary to-accent"
  },
  {
    icon: TrendingUp,
    title: "Gestão de Ganhos em Tempo Real",
    description: "Tenha um painel financeiro completo para acompanhar suas comissões, recebimentos e histórico. Segurança e clareza para você focar no que importa: sua arte.",
    gradient: "from-accent to-primary"
  },
  {
    icon: MapPin,
    title: "Agendamento Inteligente e GPS",
    description: "Libere sua própria agenda Lumi. Seus clientes agendam, o endereço é validado via Google Maps e você recebe a rota direta para o seu app de GPS favorito.",
    gradient: "from-success to-accent"
  },
  {
    icon: Users,
    title: "Networking de Elite",
    description: "Mantenha suas conexões com as melhores maquiadoras, mas agora com um perfil Pro. Mais autoridade para ser tagueada nos maiores eventos do mercado.",
    gradient: "from-primary to-success"
  },
  {
    icon: Crown,
    title: "Desbloqueie a Lumi Pro",
    description: "Transforme sua rotina com acesso ilimitado a todas as funções premium. Clique abaixo e faça seu upgrade para o Plano Pro hoje mesmo!",
    gradient: "from-accent to-primary"
  }
];

export function LumiProCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Carousel
        opts={{
          align: "center",
          loop: true,
        }}
        className="w-full"
        setApi={(api) => {
          api?.on("select", () => {
            setCurrentSlide(api.selectedScrollSnap());
          });
        }}
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="glass-card border-0 overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`bg-gradient-to-br ${slide.gradient} p-10 md:p-16`}>
                      <div className="flex flex-col items-center text-center space-y-8">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                          <slide.icon className="h-10 w-10 text-white" />
                        </div>
                        
                        <div className="space-y-4 max-w-xl">
                          <h3 className="font-serif font-semibold text-2xl md:text-3xl text-white">
                            {slide.title}
                          </h3>
                          <p className="text-white/90 text-lg leading-relaxed">
                            {slide.description}
                          </p>
                        </div>

                        {index === slides.length - 1 && (
                          <Link to="/planos">
                            <Button 
                              size="lg" 
                              className="bg-white text-primary hover:bg-white/90 glow-hover text-lg px-8"
                            >
                              Fazer Upgrade Agora
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="flex items-center justify-center mt-8 gap-4">
          <CarouselPrevious className="relative left-0 translate-y-0 bg-background hover:bg-muted" />
          
          {/* Dots indicator */}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? "w-8 bg-primary" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                onClick={() => {}}
              />
            ))}
          </div>
          
          <CarouselNext className="relative right-0 translate-y-0 bg-background hover:bg-muted" />
        </div>
      </Carousel>
    </div>
  );
}