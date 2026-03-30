import { ReactNode } from 'react'
import Header from '@/components/ui/layout/Header'
import Footer from '@/components/ui/layout/Footer'

interface LandingLayoutProps {
  children: ReactNode
}

export const LandingLayout = ({ children }: LandingLayoutProps) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="relative z-10">{children}</main>
      <Footer />
    </div>
  )
}
