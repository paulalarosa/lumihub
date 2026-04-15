import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!overlayRef.current) return

    // Screen wipe animation
    const tl = gsap.timeline()
    
    tl.set(overlayRef.current, { scaleY: 0, transformOrigin: 'top' })
    tl.to(overlayRef.current, {
      scaleY: 1,
      duration: 0.6,
      ease: 'power4.inOut',
    })
    tl.to(overlayRef.current, {
      scaleY: 0,
      transformOrigin: 'bottom',
      duration: 0.6,
      ease: 'power4.inOut',
      delay: 0.1,
    })
  }, [location.pathname])

  return (
    <>
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-white z-[9999] pointer-events-none scale-y-0"
      />
      {children}
    </>
  )
}
