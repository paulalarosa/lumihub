import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { LumiProCarousel } from "@/components/marketing/LumiProCarousel";
import AIAssistantFAB from "@/components/ai-assistant/AIAssistantFAB";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingGlassShapes } from "@/components/animations/FloatingGlassShapes";
import { CountUp } from "@/components/animations/CountUp";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerAnimation";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { useScroll, useParallax } from "@/hooks/useScroll";
import heroFallback from "@/assets/hero-beauty.jpg";
import heroImage from "@/assets/hero-image.png";
import { Users, Calendar, CreditCard, Palette, FileText, BarChart3, CheckCircle, ArrowRight, Star, Sparkles, Crown, Clock, FileSignature, TrendingUp, Bot } from "lucide-react";
import { motion, useScroll as useFramerScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import SEOHead from "@/components/seo/SEOHead";

const Home = () => {
  const { scrollY } = useScroll();
  const imageY = useParallax(scrollY, [0, 500], [0, 150]);
  const marqueeRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useFramerScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => { };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Crown, title: "Gestão de Império", description: "Gerencie clientes, histórico e anotações com a maestria de quem constrói um legado.", size: "large" },
    { icon: Clock, title: "Linha do Tempo Visual", description: "Visualize sua agenda como uma obra de arte, com cronogramas precisos.", size: "normal" },
    {
      icon: Bot,
      title: "Lumi IA & Automação",
      description: "Sua assistente virtual que trabalha enquanto você dorme. Confirmações, lembretes e preenchimento inteligente.",
      size: "normal"
    },
    { icon: FileSignature, title: "Contratos Inteligentes", description: "Segurança jurídica com contratos gerados automaticamente. Assinatura digital integrada na hora.", size: "normal" },
    { icon: CreditCard, title: "Financeiro Automatizado", description: "Receba via Pix e cartão com split automático e sem dores de cabeça.", size: "normal" },
    { icon: TrendingUp, title: "Inteligência de Negócio", description: "Dashboards que mostram o crescimento real do seu faturamento.", size: "large" },
  ];

  const benefits = [
    "Economize 10+ horas por semana em tarefas administrativas",
    "Aumente sua receita com processos profissionais",
    "Ofereça experiência premium para suas clientes",
    "Organize completamente seu negócio"
  ];

  const testimonials = [
    { name: "Maria Silva", role: "Maquiadora Especialista em Noivas", content: "Consegui profissionalizar completamente meu negócio. Minhas clientes adoram o portal exclusivo!", rating: 5 },
    { name: "Ana Costa", role: "Maquiadora & Beauty Artist", content: "O sistema de pagamentos mudou tudo! Agora recebo na hora e sem complicação.", rating: 5 },
    { name: "Juliana Mendes", role: "Hair Stylist", content: "A organização que a Lumi trouxe para minha rotina é indescritível. Recomendo!", rating: 5 },
    { name: "Camila Santos", role: "Nail Designer", content: "Finalmente tenho controle total das minhas finanças e agenda em um só lugar.", rating: 5 },
  ];

  return (
    <>
      <SEOHead 
        title="Lumi - Plataforma de Gestão para Profissionais de Beleza"
        description="Gerencie clientes, agenda, contratos e finanças em uma plataforma elegante. Economize 10+ horas por semana e aumente sua receita em até 40%."
        keywords="gestão para maquiadores, agenda de beleza, sistema para profissionais de beleza, contratos digitais, gestão de clientes, maquiadora profissional"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Lumi - Gestão para Profissionais de Beleza",
          "description": "Plataforma completa para gestão de negócios de beleza",
          "provider": {
            "@type": "Organization",
            "name": "Lumi"
          }
        }}
      />
      <div className="min-h-screen bg-[#050505] page-transition overflow-x-hidden" onScroll={e => scrollY.set((e.target as any).scrollTop)}>


      {/* Hero Section - Beauty Tech Design */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[#050505]" />
        <FloatingGlassShapes />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }}
        />

        {/* Cyan Glow Orbs */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-white/3 rounded-full blur-[120px]" />

        <motion.div
          className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-32"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-12"
            >
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
                >
                  <Sparkles className="h-3 w-3 mr-2 text-white/60" />
                  <span className="text-white/60 text-xs tracking-[0.2em] uppercase font-light">Elevação Visual</span>
                </motion.div>

                <h1 className="text-6xl lg:text-8xl leading-[0.95] font-serif font-light tracking-[-0.04em]">
                  <span className="bg-gradient-to-b from-white via-white/90 to-white/60 bg-clip-text text-transparent">Lumi—</span>
                  <br />
                  <span className="bg-gradient-to-r from-[#C0C0C0] via-white to-[#C0C0C0] bg-clip-text text-transparent">Excelência</span>
                  <br />
                  <span className="bg-gradient-to-b from-white/80 to-white/40 bg-clip-text text-transparent">em Arte</span>
                </h1>

                <p className="text-lg lg:text-xl text-white/50 leading-relaxed max-w-xl font-light">
                  Uma plataforma minimalista e sofisticada para profissionais de beleza que entendem o valor da elegância. Transforme sua gestão em arte.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 pt-4">
                <MagneticButton href="/register" strength={0.35}>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-[#050505] hover:bg-white/90 text-base px-8 py-6 rounded-xl font-medium border border-white/20 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  >
                    Começar Agora
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </MagneticButton>
                <MagneticButton href="/register" strength={0.35}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-transparent border border-[#C0C0C0]/30 text-white/80 hover:bg-white/5 hover:border-[#C0C0C0]/50 text-base px-8 py-6 rounded-xl transition-all duration-300"
                  >
                    Criar Conta Grátis
                  </Button>
                </MagneticButton>
              </div>

              <div className="flex items-center space-x-6 text-sm text-white/40">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-[#C0C0C0] mr-2" />
                  Teste gratuito por 14 dias
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-[#C0C0C0] mr-2" />
                  Dados 100% seguros
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
              style={{ y: imageY }}
            >
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 via-white/5 to-cyan-500/10 rounded-3xl blur-2xl" />
                <div className="absolute -inset-1 bg-gradient-to-r from-[#C0C0C0]/20 to-transparent rounded-3xl" />
                <img
                  alt="Hero image"
                  loading="eager"
                  decoding="async"
                  className="relative rounded-3xl w-full h-auto object-cover border border-white/10"
                  style={{ filter: 'grayscale(20%) contrast(1.1)' }}
                  onError={e => { (e.target as HTMLImageElement).src = heroFallback; }}
                  src={heroImage}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border border-white/20 flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-32 bg-[#050505] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20 space-y-4"
          >
            <h2 className="font-serif font-light text-4xl lg:text-6xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent tracking-[-0.02em]">
              Tudo que você precisa
            </h2>
            <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
              Uma plataforma completa para transformar seu negócio de beleza.
            </p>
          </motion.div>

          <StaggerContainer staggerChildren={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <motion.div
                  className={`group relative bg-[#1A1A1A]/40 backdrop-blur-lg border border-white/10 rounded-3xl p-8 h-full transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] ${feature.size === 'large' ? 'lg:col-span-1' : ''}`}
                  whileHover={{ y: -5, transition: { duration: 0.3 } }}
                >
                  <div className="relative space-y-6">
                    <feature.icon className="h-10 w-10 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-colors duration-300 stroke-[1.5]" />

                    <div className="space-y-3">
                      <h3 className="font-serif font-light text-2xl text-white">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed font-light">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Benefits Section */}
      <ErrorBoundary sectionName="Benefits Section">
        <section className="py-32 bg-[#050505] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.02] rounded-full blur-[100px]" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-10">
                <div className="space-y-4">
                  <h2 className="font-serif font-light text-4xl lg:text-5xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                    Por que escolher a Lumi?
                  </h2>
                  <p className="text-xl text-white/40 font-light">
                    Mais de 1.000 profissionais já transformaram seus negócios.
                  </p>
                </div>

                <div className="space-y-5">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start space-x-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#C0C0C0]/10 border border-[#C0C0C0]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-3 w-3 text-[#C0C0C0]" />
                      </div>
                      <span className="text-white/70 font-light text-lg">{benefit}</span>
                    </motion.div>
                  ))}
                </div>

                <Link to="/recursos">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-transparent border border-white/10 text-white/70 hover:bg-white/5 hover:border-[#C0C0C0]/30 rounded-xl"
                  >
                    Conhecer Todos os Recursos
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Stats Bento Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 10, suffix: "+", label: "Horas economizadas por semana" },
                  { value: 40, suffix: "%", label: "Aumento médio na receita" },
                  { value: 98, suffix: "%", label: "Satisfação das clientes" },
                  { value: null, text: "24/7", label: "Suporte disponível" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className="lumi-card p-8 text-center hover:border-cyan-500/20 transition-all duration-300"
                  >
                    <div className="text-4xl font-serif font-light text-[#C0C0C0] mb-2">
                      {stat.value !== null ? (
                        <CountUp to={stat.value} suffix={stat.suffix} duration={2.5} />
                      ) : (
                        stat.text
                      )}
                    </div>
                    <div className="text-sm text-white/40 font-light">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </ErrorBoundary>

      {/* Testimonials - Horizontal Marquee */}
      <section className="py-32 bg-[#050505] relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center space-y-4">
            <h2 className="font-serif font-light text-4xl lg:text-5xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              O que dizem nossas clientes
            </h2>
            <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
              Profissionais que já transformaram seus negócios com a Lumi.
            </p>
          </div>
        </div>

        {/* Marquee Container */}
        <div className="relative">
          {/* Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />

          <motion.div
            ref={marqueeRef}
            className="flex gap-6"
            animate={{ x: [0, -1200] }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop"
            }}
          >
            {[...testimonials, ...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[400px] backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#C0C0C0]/20 transition-all duration-300"
              >
                <div className="space-y-6">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#C0C0C0] text-[#C0C0C0]" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-white/70 italic leading-relaxed font-light">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="font-serif font-light text-white/90">{testimonial.name}</div>
                    <div className="text-sm text-white/40">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Lumi Pro Section */}
      <section className="py-32 bg-[#050505]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-serif font-light text-4xl lg:text-5xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Lumi Pro para Assistentes
            </h2>
            <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
              Eleve sua carreira com ferramentas exclusivas.
            </p>
          </div>
          <LumiProCarousel />
        </div>
      </section>

      {/* CTA Section - Metallic Gradient */}
      <section className="py-32 relative overflow-hidden">
        {/* Metallic Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#C0C0C0] via-[#8A8A8A] to-[#3A3A3A]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHBhdGggZD0iTTAgMGgxMDB2MTAwSDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTUwIDAgdjEwMCBNMCA1MCBoMTAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNwKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto space-y-10"
          >
            <div className="space-y-6">
              <h2 className="font-serif font-light text-4xl lg:text-6xl text-[#050505] tracking-[-0.02em]">
                Pronta para brilhar?
              </h2>
              <p className="text-xl text-[#050505]/70 font-light">
                Junte-se a mais de 1.000 profissionais que já iluminaram seus negócios.
                Comece seu teste gratuito hoje mesmo.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#050505] text-white hover:bg-[#1a1a1a] text-lg px-8 py-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,0,0,0.3)]"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Começar Teste Gratuito
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-transparent border-2 border-[#050505]/30 text-[#050505] hover:bg-[#050505]/10 text-lg px-8 py-6 rounded-xl"
                >
                  Ver Planos e Preços
                </Button>
              </Link>
            </div>

            <div className="text-sm text-[#050505]/60 font-light">
              ✨ Sem compromisso • Cancele quando quiser • Suporte dedicado
            </div>
          </motion.div>
        </div>
      </section>

      <AIAssistantFAB />
    </div>
    </>
  );
};

export default Home;
