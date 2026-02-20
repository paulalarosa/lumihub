import { KontrolProCarousel } from '@/components/marketing/KontrolProCarousel'
import AIAssistantFAB from '@/features/ai/components/AIAssistantFAB'
import { useScroll } from '@/hooks/useScroll'
import { useEffect } from 'react'
import SEOHead from '@/components/seo/SEOHead'
import { useLanguage } from '@/hooks/useLanguage'

// Layout Imports
import Header from '@/components/ui/layout/Header'
import Footer from '@/components/ui/layout/Footer'

// Section Imports
import { HeroSection } from './home/components/HeroSection'
import { FeaturesSection } from './home/components/FeaturesSection'
import { BenefitsSection } from './home/components/BenefitsSection'
import { TestimonialsSection } from './home/components/TestimonialsSection'
import { CtaSection } from './home/components/CtaSection'

const Home = () => {
  const { scrollY } = useScroll()
  const { t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {}
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <SEOHead
        title="KHAOS KONTROL // Control Center"
        description="Gerencie clientes, agenda, contratos e finanças em uma plataforma elegante. Economize 10+ horas por semana e aumente sua receita em até 40%. Teste grátis por 14 dias."
        keywords="gestão para maquiadores, agenda de beleza, sistema para profissionais de beleza, contratos digitais, gestão de clientes, maquiadora profissional, software para salão, sistema para noivas, khaos kontrol system"
        url="https://khaoskontrol.com.br"
        breadcrumbs={[{ name: 'Home', url: 'https://khaoskontrol.com.br' }]}
        faq={[
          {
            question: 'O que é o KHAOS KONTROL?',
            answer:
              'KHAOS KONTROL é uma plataforma completa de gestão para profissionais de beleza, incluindo agenda, contratos digitais, gestão financeira e portal do cliente.',
          },
          {
            question: 'Quanto custa o KHAOS KONTROL?',
            answer:
              'O KHAOS KONTROL oferece planos a partir de R$39,90/mês com teste gratuito de 14 dias sem necessidade de cartão de crédito.',
          },
          {
            question: 'Posso cancelar a qualquer momento?',
            answer:
              'Sim! Não há contratos de fidelidade. Você pode cancelar sua assinatura quando quiser.',
          },
          {
            question: 'O KHAOS KONTROL funciona para salões de beleza?',
            answer:
              'Sim! O KHAOS KONTROL é ideal para maquiadoras, cabeleireiras, nail designers e qualquer profissional de beleza.',
          },
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'KHAOS KONTROL',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description:
            'Plataforma de gestão completa para profissionais de beleza',
          url: 'https://khaoskontrol.com.br',
          image: 'https://khaoskontrol.com.br/og-image.png',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'BRL',
            description: 'Teste gratuito por 14 dias',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '1000',
            bestRating: '5',
          },
          featureList: [
            'Gestão de Clientes',
            'Agenda Inteligente',
            'Contratos Digitais',
            'Portal do Cliente',
            'Dashboard Financeiro',
            'Gestão de Equipe',
          ],
        }}
      />
      <Header />
      <div
        className="min-h-screen bg-black page-transition overflow-x-hidden"
        onScroll={(e) => scrollY.set((e.target as any).scrollTop)}
      >
        <HeroSection />

        <FeaturesSection />

        <BenefitsSection />

        <TestimonialsSection />

        {/* Kontrol Pro Section */}
        <section className="py-32 bg-black">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="font-serif font-light text-4xl lg:text-5xl text-white">
                {t('kontrolpro_title')}
              </h2>
              <p className="text-sm font-mono text-white/40 max-w-2xl mx-auto uppercase tracking-widest">
                {t('kontrolpro_subtitle')}
              </p>
            </div>
            <KontrolProCarousel />
          </div>
        </section>

        <CtaSection />

        <AIAssistantFAB />
        <Footer />
      </div>
    </>
  )
}

export default Home
