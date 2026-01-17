import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { LumiProCarousel } from "@/components/marketing/LumiProCarousel";
import { TrackedButton } from "@/components/analytics/TrackedButton";
import AIAssistantFAB from "@/components/ai-assistant/AIAssistantFAB";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingGlassShapes } from "@/components/animations/FloatingGlassShapes";
import { CountUp } from "@/components/animations/CountUp";
import { ScrambleNumber } from "@/components/ui/animation/ScrambleNumber";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerAnimation";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { useScroll, useParallax } from "@/hooks/useScroll";
import heroFallback from "@/assets/hero-beauty.jpg";
import heroImage from "@/assets/hero-image.png";
import { Users, Calendar, CreditCard, Palette, FileText, BarChart3, CheckCircle, ArrowRight, Star, Sparkles, Crown, Clock, FileSignature, TrendingUp, Bot } from "lucide-react";
import { motion, useScroll as useFramerScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

const Home = () => {
  const { scrollY } = useScroll();
  const imageY = useParallax(scrollY, [0, 500], [0, 150]);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const { scrollYProgress } = useFramerScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => { };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Crown, title: t("feature_1_title"), description: t("feature_1_desc"), size: "large" },
    { icon: Clock, title: t("feature_2_title"), description: t("feature_2_desc"), size: "normal" },
    {
      icon: Bot,
      title: t("feature_3_title"),
      description: t("feature_3_desc"),
      size: "normal"
    },
    { icon: FileSignature, title: t("feature_4_title"), description: t("feature_4_desc"), size: "normal" },
    { icon: CreditCard, title: t("feature_5_title"), description: t("feature_5_desc"), size: "normal" },
    { icon: TrendingUp, title: t("feature_6_title"), description: t("feature_6_desc"), size: "large" },
  ];

  const benefits = [
    t("benefit_1"),
    t("benefit_2"),
    t("benefit_3"),
    t("benefit_4")
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
      <div className="min-h-screen bg-black page-transition overflow-x-hidden" onScroll={e => scrollY.set((e.target as any).scrollTop)}>


        {/* Hero Section - Industrial Editorial Noir */}
        <section className="relative min-h-screen flex items-center bg-black overflow-hidden bg-noise">
          {/* Parallax Image Background */}
          <motion.div
            style={{ y: imageY }}
            className="absolute right-0 top-0 w-full md:w-1/2 h-full opacity-20 pointer-events-none z-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10" />
            <img src={heroImage} alt="Hero Texture" className="w-full h-full object-cover grayscale contrast-125" />
          </motion.div>

          {/* Grid Lines */}
          <div className="absolute inset-0 noir-grid-lines opacity-20 pointer-events-none" />

          <div className="container mx-auto px-6 relative z-10 pt-20">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-5xl"
            >
              {/* Badge */}
              <div className="inline-block border border-white px-3 py-1 mb-8">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white">{t("hero_badge")}</span>
              </div>

              {/* Headline */}
              <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white leading-[0.9] tracking-tighter mb-12">
                {t("hero_title").split(' ').map((word, i) => (
                  <span key={i}>{word} <br /> </span>
                )).slice(0, 2)}
                {/* Simple hack for split, might need better handling if phrases vary length significantly */}
                {/* Actually let's just use the string directly if possible or dangerouslySetInnerHTML? No, safer to just text. */}
                {/* Reverting to simple text rendered */}
                <span dangerouslySetInnerHTML={{ __html: t("hero_title").replace('DO SEU', '<br />DO SEU').replace('BACKSTAGE', 'BACKSTAGE<br/>') }} />
              </h1>
              {/* Force re-render isn't great. Let's just output text. The <br/> was key in original design.
                 Let's assume the translation implies line breaks or we use max-width.
                 Original:
                 O BACKSTAGE <br />
                 DO SEU IMPÉRIO.
              */}
              <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white leading-[0.9] tracking-tighter mb-12 whitespace-pre-line">
                {t("hero_title").replace("BACKSTAGE", "BACKSTAGE\n").replace("IMPÉRIO", "IMPÉRIO")}
              </h1>

              {/* CTA & Subtext */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-12 border-t border-white/20 pt-12">
                <Link to="/register">
                  <button className="noir-button text-sm w-full md:w-auto">
                    {t("cta_start")} -&gt;
                  </button>
                </Link>

                <p className="font-mono text-xs text-white/60 max-w-sm uppercase tracking-wide leading-relaxed">
                  {t("hero_subtitle")}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Decorative Technical Elements */}
          <div className="absolute top-0 right-0 p-8 hidden md:block">
            <div className="font-mono text-[10px] text-white/40 text-right space-y-2">
              <p>{t("hero_status_online")}</p>
              <p>{t("hero_loc")}</p>
              <p>TIME: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 hidden md:block">
            <div className="w-32 h-32 border border-white/20 rounded-full flex items-center justify-center animate-spin-slow">
              <div className="w-full h-[1px] bg-white/20" />
              <div className="absolute h-full w-[1px] bg-white/20" />
            </div>
          </div>
        </section>

        {/* Features Section - Modular Rack Grid */}
        <section className="py-32 bg-black relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-24 space-y-4">
              <h2 className="font-serif font-light text-6xl text-white tracking-tighter">
                {t("features_title")}
              </h2>
              <p className="font-mono text-sm text-gray-500 uppercase tracking-widest">
                {t("features_subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/20 border border-white/20">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-black p-8 aspect-square flex flex-col justify-between hover:bg-white transition-colors duration-0"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] text-gray-600 group-hover:text-black">
                      [MOD.0{index + 1}]
                    </span>
                    <feature.icon className="h-8 w-8 text-white group-hover:text-black stroke-[1.5]" />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-mono text-lg uppercase tracking-wider text-white group-hover:text-black">
                      {feature.title}
                    </h3>
                    <p className="font-mono text-xs text-gray-500 leading-relaxed group-hover:text-black/70">
                      {feature.description}
                      <span className="opacity-0 group-hover:opacity-100 ml-2 inline-block w-2 H-4 bg-black animate-pulse">_</span>
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section - Raw Data Terminal */}
        <section className="py-32 bg-black relative border-t border-white/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-stretch">

              {/* Left Column: System Checklist */}
              <div className="flex flex-col justify-center space-y-12">
                <div className="space-y-6">
                  <h2 className="font-serif text-5xl text-white leading-none whitespace-pre-line">
                    {t("benefits_title").replace(" ", "\n")}
                  </h2>
                  <div className="h-[1px] w-24 bg-white/50" />
                </div>

                <div className="space-y-6 font-mono text-sm">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-4 text-gray-400 hover:text-white transition-colors cursor-default"
                    >
                      <span className="text-white shrink-0">[&gt;]</span>
                      <span className="uppercase tracking-wide">{benefit}</span>
                    </motion.div>
                  ))}
                </div>

                <Link to="/recursos">
                  <Button
                    variant="ghost"
                    className="group rounded-none border border-white/20 px-8 py-6 text-white hover:bg-white hover:text-black transition-all"
                  >
                    <span className="font-mono text-xs uppercase tracking-[0.2em] mr-4">{t("view_all_features")}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Right Column: Data Scramble Readout */}
              <div className="flex flex-col justify-center">
                <div className="border-l-2 border-white pl-12 py-12 space-y-24">
                  {[
                    { value: 10, suffix: "+", label: t("stat_hours_label") },
                    { value: 40, suffix: "%", label: t("stat_revenue_label") },
                    { value: 98, suffix: "%", label: t("stat_satisfaction_label") },
                  ].map((stat, i) => (
                    <div key={i} className="relative">
                      <div className="font-mono text-7xl md:text-8xl font-bold text-white tracking-tighter leading-none">
                        <ScrambleNumber value={stat.value} suffix={stat.suffix} />
                      </div>
                      <div className="font-mono text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-2 ml-1">
                         /// {stat.label}
                      </div>
                    </div>
                  ))}

                  {/* 24/7 Special Stat */}
                  <div className="relative">
                    <div className="font-mono text-7xl md:text-8xl font-bold text-white tracking-tighter leading-none">
                      24/7
                    </div>
                    <div className="font-mono text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-2 ml-1">
                         /// {t("stat_support_label")}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Testimonials - Horizontal Marquee */}
        <section className="py-32 bg-black relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <div className="text-center space-y-4">
              <h2 className="font-serif font-light text-4xl lg:text-5xl text-white tracking-tight">
                {t("testimonials_title")}
              </h2>
              <p className="text-sm font-mono text-white/40 max-w-2xl mx-auto uppercase tracking-widest">
                {t("testimonials_subtitle")}
              </p>
            </div>
          </div>

          {/* Marquee Container */}
          <div className="relative">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />

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
                  className="flex-shrink-0 w-[400px] border border-white/20 bg-black rounded-none p-8 hover:bg-white hover:text-black group transition-all duration-300"
                >
                  <div className="space-y-6">
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-white text-white group-hover:fill-black group-hover:text-black" />
                      ))}
                    </div>
                    <blockquote className="text-lg text-white/70 italic leading-relaxed font-light group-hover:text-black/70">
                      "{testimonial.content}"
                    </blockquote>
                    <div>
                      <div className="font-serif font-light text-white group-hover:text-black uppercase">{testimonial.name}</div>
                      <div className="text-xs font-mono text-white/40 group-hover:text-black/40 uppercase tracking-widest">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Lumi Pro Section */}
        <section className="py-32 bg-black">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="font-serif font-light text-4xl lg:text-5xl text-white">
                {t("lumipro_title")}
              </h2>
              <p className="text-sm font-mono text-white/40 max-w-2xl mx-auto uppercase tracking-widest">
                {t("lumipro_subtitle")}
              </p>
            </div>
            <LumiProCarousel />
          </div>
        </section>

        {/* CTA Section - Metallic Gradient */}
        <section className="py-32 relative overflow-hidden bg-black border-t border-white/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto space-y-10"
            >
              <div className="space-y-6">
                <h2 className="font-serif text-5xl lg:text-7xl text-white tracking-tighter uppercase">
                  {t("cta_bottom_title")}
                </h2>
                <p className="text-lg text-white/60 font-mono uppercase tracking-widest">
                  {t("cta_bottom_subtitle")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <TrackedButton
                    trackingName="cta_start_trial"
                    trackingLocation="home_cta"
                    trackingDestination="/register"
                    size="lg"
                    className="w-full sm:w-auto bg-white text-black hover:bg-white/80 text-lg px-8 py-6 rounded-none transition-all duration-300 font-mono uppercase tracking-widest"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t("cta_bottom_start")}
                  </TrackedButton>
                </Link>
                <Link to="/register">
                  <TrackedButton
                    trackingName="cta_view_plans"
                    trackingLocation="home_cta"
                    trackingDestination="/register"
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-transparent border border-white/20 text-white hover:bg-white hover:text-black text-lg px-8 py-6 rounded-none font-mono uppercase tracking-widest"
                  >
                    {t("cta_bottom_plans")}
                  </TrackedButton>
                </Link>
              </div>

              <div className="text-xs text-white/30 font-mono uppercase tracking-widest">
                {t("cta_secure")}
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
