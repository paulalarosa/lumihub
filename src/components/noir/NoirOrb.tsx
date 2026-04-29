import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei'
import type { Mesh } from 'three'

/**
 * Probe se podemos renderizar WebGL com decência:
 * - Tem suporte WebGL?
 * - Não estamos em automation (Playwright/Puppeteer headless sem GPU)?
 * - Usuária não pediu "reduce motion"?
 */
function canRenderOrb(): boolean {
  if (typeof window === 'undefined') return false

  // Skip em automation (CI Playwright tests, Puppeteer prerender)
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false

  // Respeita preferência de movimento reduzido
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return false
  }

  // Feature detect WebGL
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    return !!gl
  } catch {
    return false
  }
}

interface NoirOrbProps {
  /** Tamanho do canvas. */
  className?: string
  /** Distorção (0-1). Default 0.5. */
  distort?: number
  /** Velocidade da distorção. Default 1.4. */
  speed?: number
  /** Intensidade do emissive (0-1). Default 0.45 — luminosidade do orb. */
  emissive?: number
}

function OrbMesh({ distort = 0.5, speed = 1.4, emissive = 0.45 }: Omit<NoirOrbProps, 'className'>) {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    // Rotação lenta + reativa ao mouse parallax
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.08
    meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.04
    meshRef.current.position.x = state.mouse.x * 0.4
    meshRef.current.position.y = state.mouse.y * 0.3
  })

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <Sphere ref={meshRef} args={[1.6, 96, 96]}>
        <MeshDistortMaterial
          color="#0a0a0a"
          emissive="#ffffff"
          emissiveIntensity={emissive}
          roughness={0.9}
          metalness={0.1}
          distort={distort}
          speed={speed}
        />
      </Sphere>
    </Float>
  )
}

/**
 * Orb 3D orgânico em B&W puro. Sphere com distortion shader (Perlin noise)
 * cria movimento fluido tipo a curva iridescente da referência mas em
 * preto/branco. Mouse parallax leve dá interatividade subliminar.
 *
 * Lazy-loaded — Three.js só carrega após hero entrar viewport.
 */
export function NoirOrb({
  className = '',
  distort = 0.5,
  speed = 1.4,
  emissive = 0.45,
}: NoirOrbProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    setShouldRender(canRenderOrb())
  }, [])

  if (!shouldRender) return null

  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Luz ambiente baixa pra preto preservar; luz direcional cria highlight */}
          <ambientLight intensity={0.15} color="#ffffff" />
          <directionalLight position={[3, 4, 5]} intensity={0.9} color="#ffffff" />
          <directionalLight position={[-3, -2, 2]} intensity={0.3} color="#ffffff" />

          <OrbMesh distort={distort} speed={speed} emissive={emissive} />
        </Suspense>
      </Canvas>
    </div>
  )
}
