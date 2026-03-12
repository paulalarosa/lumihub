import Header from '@/components/ui/layout/Header'
import Footer from '@/components/ui/layout/Footer'
import { HeroSection } from './home/components/HeroSection'
import { KeyNumbersSection } from './home/components/KeyNumbersSection'
import { ProcessSection } from './home/components/ProcessSection'
import { CTASection } from './home/components/CTASection'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black overflow-hidden font-inter selection:bg-white/20 selection:text-white">
      <Header />
      <HeroSection />
      <KeyNumbersSection />
      <ProcessSection />
      <CTASection />
      <Footer />
    </div>
  )
}
