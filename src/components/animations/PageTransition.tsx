import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!overlayRef.current) return

    const tl = gsap.timeline()
    tl.set(overlayRef.current, { opacity: 0 })
    tl.to(overlayRef.current, {
      opacity: 0.9,
      duration: 0.2,
      ease: 'power2.in',
    })
    tl.to(overlayRef.current, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.out',
    })
  }, [location.pathname])

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black z-[9999] pointer-events-none opacity-0"
      />
      {children}
    </>
  )
}
