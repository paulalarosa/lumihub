import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { SparkleCanvas } from '@/components/animations/SparkleCanvas'

const MarketingLayout = () => {
  return (
    <div className="relative min-h-screen bg-[#050505] selection:bg-white/20 selection:text-white overflow-hidden">
      {}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />
      {}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-[#00e5ff]/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <SparkleCanvas />

      <Header />
      <div className="relative z-10">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

export default MarketingLayout
