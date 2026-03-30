import { ReactNode, lazy, Suspense } from 'react'
import Header from '@/components/ui/layout/Header'
import Footer from '@/components/ui/layout/Footer'
import { SparkleCanvas } from '@/components/animations/SparkleCanvas'
import { GradientMesh } from '@/components/animations/GradientMesh'

const Hero3DBackground = lazy(() => import('@/components/ui/Hero3DBackground'))
const ParticleField3D = lazy(
  () => import('@/components/animations/ParticleField3D'),
)

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
        <div className="fixed inset-0 -z-10 bg-black">
          <Suspense fallback={<div className="h-screen bg-black" />}>
            <ParticleField3D />
            <Hero3DBackground />
          </Suspense>
        </div>
      )}

      <SparkleCanvas />

      {/* Main Content */}
      <main className="relative z-10">{children}</main>

      <Footer />
    </div>
  )
}
