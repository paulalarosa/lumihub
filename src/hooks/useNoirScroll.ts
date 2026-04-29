import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * useNoirScroll — wires GSAP ScrollTrigger animations comuns numa página
 * Noir. Apply via data-attributes nos elementos:
 *
 *   data-noir-parallax="0.3"   — element move slower que scroll (factor 0-1)
 *   data-noir-drift="-200"     — element drifts horizontalmente (px)
 *   data-noir-fade-up          — fade in + lift on enter viewport
 *   data-noir-pin              — pin section while scrolling internal content
 *
 * Cleanup automático no unmount. Reativa em resize.
 */
export function useNoirScroll(deps: unknown[] = []) {
  const ctxRef = useRef<gsap.Context | null>(null)

  // useLayoutEffect garante que medições de DOM (gsap precisa) acontecem
  // após pintura — evita flash de elementos pré-animação.
  useLayoutEffect(() => {
    ctxRef.current = gsap.context(() => {
      // Parallax vertical
      document.querySelectorAll<HTMLElement>('[data-noir-parallax]').forEach((el) => {
        const factor = parseFloat(el.dataset.noirParallax ?? '0.3')
        gsap.to(el, {
          yPercent: factor * -50,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })
      })

      // Drift horizontal (big text)
      document.querySelectorAll<HTMLElement>('[data-noir-drift]').forEach((el) => {
        const distance = parseFloat(el.dataset.noirDrift ?? '-200')
        gsap.to(el, {
          x: distance,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          },
        })
      })

      // Fade up on enter — alternativa GSAP às variantes framer
      document.querySelectorAll<HTMLElement>('[data-noir-fade-up]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 32, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          },
        )
      })
    })

    return () => ctxRef.current?.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // Refresh ScrollTrigger em resize — necessário pra layouts responsivos
  useEffect(() => {
    const handler = () => ScrollTrigger.refresh()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
}
