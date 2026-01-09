import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LumiProCarousel } from "@/components/marketing/LumiProCarousel";
import AIAssistantFAB from "@/components/ai-assistant/AIAssistantFAB";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingGlassShapes } from "@/components/animations/FloatingGlassShapes";
import { CountUp } from "@/components/animations/CountUp";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerAnimation";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { useScroll, useParallax } from "@/hooks/useScroll";
import heroFallback from "@/assets/hero-beauty.jpg";
import { Users, Calendar, CreditCard, Palette, FileText, BarChart3, CheckCircle, ArrowRight, Star, Shield, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
const Home = () => {
  // Scroll animations
  const {
    scrollY
  } = useScroll();
  const imageY = useParallax(scrollY, [0, 500], [0, 150]);

  // Update scroll when window scrolls
  useEffect(() => {
    const handleScroll = () => {
      // The hook handles this automatically
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const features = [{
    icon: Users,
    title: "CRM Completo",
    description: "Gerencie clientes, histórico e anotações em um só lugar"
  }, {
    icon: Calendar,
    title: "Gestão de Projetos",
    description: "Organize cada evento com checklists e cronogramas"
  }, {
    icon: Palette,
    title: "Moodboard Interativo",
    description: "Colabore com clientes em referências visuais"
  }, {
    icon: FileText,
    title: "Contratos Automáticos",
    description: "Gere contratos profissionais em minutos"
  }, {
    icon: CreditCard,
    title: "Pagamentos Integrados",
    description: "Receba via Pix e cartão com split automático"
  }, {
    icon: BarChart3,
    title: "Relatórios Financeiros",
    description: "Acompanhe sua receita e crescimento"
  }];
  const benefits = ["Economize 10+ horas por semana em tarefas administrativas", "Aumente sua receita com processos profissionais", "Ofereça experiência premium para suas clientes", "Organize completamente seu negócio"];
  const testimonials = [{
    name: "Maria Silva",
    role: "Maquiadora Especialista em Noivas",
    content: "Consegui profissionalizar completamente meu negócio. Minhas clientes adoram o portal exclusivo!",
    rating: 5
  }, {
    name: "Ana Costa",
    role: "Maquiadora & Beauty Artist",
    content: "O sistema de pagamentos mudou tudo! Agora recebo na hora e sem complicação.",
    rating: 5
  }];
  return <div className="min-h-screen bg-background page-transition" onScroll={e => scrollY.set((e.target as any).scrollTop)}>
      <Header />
      
      {/* Hero Section - Elite Lunar Design */}
      <section className="relative overflow-hidden py-32 lg:py-48">
        <FloatingGlassShapes />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div initial={{
            opacity: 0,
            y: 40
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8
          }} className="space-y-12">
              <div className="space-y-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] font-medium text-xs tracking-widest uppercase">
                  <Sparkles className="h-3 w-3 mr-2" />
                  Elevação Visual
                </div>
                <h1 className="hero-title text-6xl lg:text-8xl text-foreground leading-[0.95] mb-6">
                  Lumi—
                  <br />
                  <span className="text-[hsl(var(--primary))]">Excelência</span>
                  <br />
                  em Arte
                </h1>
                <p className="hero-subtitle text-lg lg:text-xl text-[hsl(var(--muted-foreground))] leading-relaxed max-w-xl font-light">
                  Uma plataforma minimalista e sofisticada para profissionais de beleza que entendem o valor da elegância. Transforme sua gestão em arte.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5 pt-4">
                <MagneticButton href="/cadastro" strength={0.35}>
                  <Button size="lg" className="w-full sm:w-auto button-glow bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-0 text-base px-8 py-6 rounded-[1rem] font-medium hover:bg-[hsl(var(--accent))]">
                    Começar Agora
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </MagneticButton>
                <MagneticButton href="/demo" strength={0.35}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto lumi-button-ghost text-base px-8 py-6">
                    Ver Demo
                  </Button>
                </MagneticButton>
              </div>

              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Teste gratuito por 14 dias
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-success mr-2" />
                  Dados 100% seguros
                </div>
              </div>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            scale: 0.95
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.8,
            delay: 0.2
          }} className="relative" style={{
            y: imageY
          }}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
                <img alt="Imagem hero: maquiagem clean girl com produtos prateados sobre vidro" loading="eager" decoding="async" className="relative rounded-3xl shadow-strong w-full h-auto object-cover" onError={e => {
                (e.target as HTMLImageElement).src = heroFallback;
              }} src="/lovable-uploads/a31a9b03-93e4-458b-9943-6bacdab4533d.png" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.8
        }} className="text-center mb-16 space-y-4">
            <h2 className="font-serif font-semibold text-4xl lg:text-5xl text-foreground">
              Tudo que você precisa
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa para transformar seu negócio de beleza.
            </p>
          </motion.div>

          <StaggerContainer staggerChildren={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => <StaggerItem key={index}>
                <Card className="glass-card border-0 glow-hover h-full">
                  <CardContent className="p-8 space-y-4">
                    <motion.div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center" whileHover={{
                  scale: 1.1,
                  rotate: 5
                }} transition={{
                  type: "spring",
                  stiffness: 400
                }}>
                      <feature.icon className="h-7 w-7 text-primary" />
                    </motion.div>
                    <h3 className="font-serif font-semibold text-xl text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>)}
          </StaggerContainer>
        </div>
      </section>

      {/* Benefits Section */}
      <ErrorBoundary sectionName="Benefits Section - Why Choose Lumi">
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-10">
                <div className="space-y-4">
                  <h2 className="font-serif font-semibold text-4xl lg:text-5xl text-foreground">
                    Por que escolher a Lumi?
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    Mais de 1.000 profissionais já transformaram seus negócios.
                  </p>
                </div>

              <div className="space-y-5">
                {benefits.map((benefit, index) => <motion.div key={index} className="flex items-start space-x-4" initial={{
                  opacity: 0,
                  x: -20
                }} whileInView={{
                  opacity: 1,
                  x: 0
                }} transition={{
                  duration: 0.5,
                  delay: index * 0.1
                }} viewport={{
                  once: true
                }}>
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground font-medium text-lg">{benefit}</span>
                  </motion.div>)}
              </div>

              <Link to="/recursos">
                <Button variant="outline" size="lg" className="glow-hover">
                  Conhecer Todos os Recursos
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Stats Bento Grid */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{
                scale: 1.02
              }} className="glass-card rounded-2xl p-8 text-center">
                <div className="text-4xl font-serif font-bold text-primary mb-2">
                  <CountUp to={10} suffix="+" duration={2.5} />
                </div>
                <div className="text-sm text-muted-foreground">Horas economizadas por semana</div>
              </motion.div>
              <motion.div whileHover={{
                scale: 1.02
              }} className="glass-card rounded-2xl p-8 text-center">
                <div className="text-4xl font-serif font-bold text-accent mb-2">
                  <CountUp to={40} suffix="%" duration={2.5} />
                </div>
                <div className="text-sm text-muted-foreground">Aumento médio na receita</div>
              </motion.div>
              <motion.div whileHover={{
                scale: 1.02
              }} className="glass-card rounded-2xl p-8 text-center">
                <div className="text-4xl font-serif font-bold text-success mb-2">
                  <CountUp to={98} suffix="%" duration={2.5} />
                </div>
                <div className="text-sm text-muted-foreground">Satisfação das clientes</div>
              </motion.div>
              <motion.div whileHover={{
                scale: 1.02
              }} className="glass-card rounded-2xl p-8 text-center">
                <div className="text-4xl font-serif font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Suporte disponível</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      </ErrorBoundary>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-serif font-semibold text-4xl lg:text-5xl text-foreground">
              O que dizem nossas clientes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Profissionais que já transformaram seus negócios com a Lumi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: index * 0.1
          }} viewport={{
            once: true
          }}>
                <Card className="glass-card border-0 p-8">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="h-5 w-5 fill-accent text-accent" />)}
                    </div>
                    <blockquote className="text-lg text-foreground italic leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    <div>
                      <div className="font-serif font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Lumi Pro Carousel Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="font-serif font-semibold text-4xl lg:text-5xl text-foreground">
              Lumi Pro para Assistentes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Eleve sua carreira com ferramentas exclusivas.
            </p>
          </div>
          <LumiProCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-95" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} viewport={{
          once: true
        }} className="max-w-3xl mx-auto space-y-10">
            <div className="space-y-6">
              <h2 className="font-serif font-semibold text-4xl lg:text-5xl text-white">
                Pronta para brilhar?
              </h2>
              <p className="text-xl text-white/90">
                Junte-se a mais de 1.000 profissionais que já iluminaram seus negócios. 
                Comece seu teste gratuito hoje mesmo.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
                  <Zap className="h-5 w-5 mr-2" />
                  Começar Teste Gratuito
                </Button>
              </Link>
              <Link to="/planos">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6">
                  Ver Planos e Preços
                </Button>
              </Link>
            </div>

            <div className="text-sm text-white/80">
              ✨ Sem compromisso • Cancele quando quiser • Suporte dedicado
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <AIAssistantFAB />
    </div>;
};
export default Home;