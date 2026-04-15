import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { SparkleCanvas } from '@/components/animations/SparkleCanvas'
import { SmoothScroll } from './SmoothScroll'
import { PageTransition } from '@/components/animations/PageTransition'

const MarketingLayout = () => {
  return (
    <PageTransition>
      <SmoothScroll>
        <div className="relative min-h-screen bg-[#050505] selection:bg-white/20 selection:text-white overflow-hidden bg-noise">
          {}
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-[#00e5ff]/5 blur-[120px] rounded-full pointer-events-none z-0" />

          <SparkleCanvas />

          <Header />
          <div className="relative z-10">
            <Outlet />
          </div>
          <Footer />
        </div>
      </SmoothScroll>
    </PageTransition>
  )
}

export default MarketingLayout
