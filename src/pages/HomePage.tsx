import Header from '@/components/ui/layout/Header'
import Footer from '@/components/ui/layout/Footer'
import { HeroSection } from '@/pages/home/components/HeroSection'
import { KeyNumbersSection } from '@/pages/home/components/KeyNumbersSection'
import { ProcessSection } from '@/pages/home/components/ProcessSection'
import { CTASection } from '@/pages/home/components/CTASection'
import SEOHead from '@/components/seo/SEOHead'

import { useLanguage } from '@/hooks/useLanguage'

export default function HomePage() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-black overflow-hidden font-inter selection:bg-white/20 selection:text-white">
      <SEOHead
        title={t('home.hero.title_1') + ' ' + t('home.hero.title_2')}
        description={t('home.hero.subtitle')}
        keywords="sistema gestão maquiadora, CRM maquiadora, agenda maquiadora profissional, contrato digital maquiagem, portal noiva, gestão beauty, software maquiadora"
        url="https://khaoskontrol.com.br/"
        faq={[
          {
            question: 'O que é o Khaos Kontrol?',
            answer:
              'É um sistema de gestão completo para maquiadoras profissionais. Organiza clientes, contratos, agenda e financeiro em uma única plataforma.',
          },
          {
            question: 'Quanto custa o Khaos Kontrol?',
            answer:
              'Os planos começam em R$39,92/mês no plano anual. Todos os planos incluem 14 dias de teste grátis sem cartão de crédito.',
          },
          {
            question: 'Preciso de cartão de crédito para testar?',
            answer:
              'Não. O teste de 14 dias é completamente grátis e não requer cartão de crédito.',
          },
          {
            question: 'O sistema tem portal para as noivas?',
            answer:
              'Sim. Cada cliente recebe um portal exclusivo onde pode ver cronograma, documentos e detalhes do evento.',
          },
          {
            question: 'Posso gerenciar minha equipe de assistentes?',
            answer:
              'Sim. O plano Studio permite gestão completa de equipe com comissões automáticas e dashboard de performance.',
          },
        ]}
      />
      <Header />
      <HeroSection />
      <KeyNumbersSection />
      <ProcessSection />
      <CTASection />
      <Footer />
    </div>
  )
}
