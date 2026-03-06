import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

export const SparkleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      // Criar sparkles ao mover o mouse
      for (let i = 0; i < 3; i++) {
        createParticle(e.clientX, e.clientY)
      }
    }

    // Criar partícula
    const createParticle = (x: number, y: number) => {
      const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#F59E0B']
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 1,
        life: 1,
        maxLife: 60 + Math.random() * 60,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update e desenhar partículas
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05 // Gravidade
        p.life++

        const opacity = 1 - p.life / p.maxLife

        if (opacity > 0) {
          // Sparkle drawing (star)
          ctx.save()
          ctx.globalAlpha = opacity
          ctx.fillStyle = p.color

          // 4-pointed star
          ctx.beginPath()
          for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i
            const x = p.x + Math.cos(angle) * p.size
            const y = p.y + Math.sin(angle) * p.size
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              const innerSize = p.size * 0.3
              const innerAngle = angle - Math.PI / 4
              ctx.lineTo(
                p.x + Math.cos(innerAngle) * innerSize,
                p.y + Math.sin(innerAngle) * innerSize,
              )
              ctx.lineTo(x, y)
            }
          }
          ctx.closePath()
          ctx.fill()

          // Efficient Glow (multi-layer fill)
          ctx.globalAlpha = opacity * 0.4
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
          ctx.fill()

          ctx.restore()
          return true
        }
        return false
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove)
    animate()

    // Criar sparkles aleatórios periodicamente
    const intervalId = setInterval(() => {
      if (canvasRef.current && particlesRef.current.length < 20) {
        const x = Math.random() * canvasRef.current.width
        const y = Math.random() * canvasRef.current.height
        createParticle(x, y)
      }
    }, 500)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(intervalId)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
