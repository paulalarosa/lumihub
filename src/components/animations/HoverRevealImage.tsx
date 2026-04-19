import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface HoverRevealImageProps {
  src: string
  alt: string
  className?: string
}

export const HoverRevealImage = ({ src, alt, className = '' }: HoverRevealImageProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current || !imageRef.current || !overlayRef.current) return

    const tl = gsap.timeline({ paused: true })

    tl.to(imageRef.current, {
      scale: 1.1,
      duration: 0.8,
      ease: 'power2.out',
    }, 0)

    tl.to(overlayRef.current, {
      opacity: 0.4,
      duration: 0.8,
      ease: 'power2.out',
    }, 0)

    containerRef.current.addEventListener('mouseenter', () => tl.play())
    containerRef.current.addEventListener('mouseleave', () => tl.reverse())

    return () => {
      containerRef.current?.removeEventListener('mouseenter', () => tl.play())
      containerRef.current?.removeEventListener('mouseleave', () => tl.reverse())
    }
  }, { scope: containerRef })

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-pointer group ${className}`}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="w-full h-full object-cover will-change-transform"
      />
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black opacity-0 pointer-events-none transition-opacity"
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-1 h-1 bg-white rounded-full animate-ping" />
        </div>
      </div>
    </div>
  )
}
