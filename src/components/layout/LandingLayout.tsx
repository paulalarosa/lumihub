import { ReactNode } from 'react'
import Header from '@/components/ui/layout/Header'
import Footer from '@/components/ui/layout/Footer'
import { SparkleCanvas } from '@/components/animations/SparkleCanvas'
import { GradientMesh } from '@/components/animations/GradientMesh'
import { PerformanceWrapper } from '@/components/animations/PerformanceWrapper'
import { ParticleField3D } from '@/components/animations/ParticleField3D'

interface LandingLayoutProps {
  children: ReactNode
  showParticles?: boolean
}

export const LandingLayout = ({
  children,
  showParticles = true,
}: LandingLayoutProps) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Background Animations */}
      <GradientMesh />

      {showParticles && (
        <PerformanceWrapper require3D fallback={<GradientMesh />}>
          <ParticleField3D />
        </PerformanceWrapper>
      )}

      <SparkleCanvas />

      {/* Main Content */}
      <main className="relative z-10">{children}</main>

      <Footer />
    </div>
  )
}
