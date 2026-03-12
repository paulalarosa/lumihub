import { useState } from 'react'
import Header from '@/components/ui/layout/Header'
import Footer from '@/components/ui/layout/Footer'
import { PricingHeader } from './planos/components/PricingHeader'
import { PricingCards } from './planos/components/PricingCards'
import { TrustQuote } from './planos/components/TrustQuote'

export default function PlansPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly',
  )

  return (
    <div className="min-h-screen bg-black font-inter selection:bg-white/20 selection:text-white">
      <Header />
      <PricingHeader
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
      />
      <PricingCards billingCycle={billingCycle} />
      <TrustQuote />
      <Footer />
    </div>
  )
}
