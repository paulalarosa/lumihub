import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Particles = ({ count = 5000 }) => {
  const mesh = useRef<THREE.Points>(null)
  const light = useRef<THREE.PointLight>(null)

  // Gerar posições das partículas
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Posições aleatórias em esfera
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const radius = 5 + Math.random() * 15

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // Cores (roxo/rosa/azul)
      const colorChoice = Math.random()
      if (colorChoice < 0.33) {
        colors[i * 3] = 0.54 // R (roxo)
        colors[i * 3 + 1] = 0.36 // G
        colors[i * 3 + 2] = 0.96 // B
      } else if (colorChoice < 0.66) {
        colors[i * 3] = 0.92 // R (rosa)
        colors[i * 3 + 1] = 0.36 // G
        colors[i * 3 + 2] = 0.6 // B
      } else {
        colors[i * 3] = 0.23 // R (azul)
        colors[i * 3 + 1] = 0.51 // G
        colors[i * 3 + 2] = 0.96 // B
      }
    }

    return [positions, colors]
  }, [count])

  // Animação
  useFrame((state) => {
    if (!mesh.current) return

    const time = state.clock.getElapsedTime()

    // Rotação suave
    mesh.current.rotation.x = time * 0.05
    mesh.current.rotation.y = time * 0.075

    // Pulsação das partículas
    const scale = 1 + Math.sin(time * 0.5) * 0.1
    mesh.current.scale.set(scale, scale, scale)

    // Luz seguindo o mouse (simulado pelo tempo neste caso)
    if (light.current) {
      light.current.position.x = Math.sin(time * 0.5) * 10
      light.current.position.y = Math.cos(time * 0.3) * 10
    }
  })

  return (
    <group>
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      <pointLight ref={light} intensity={2} distance={20} color="#8B5CF6" />
    </group>
  )
}

export const ParticleField3D = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Particles count={3000} />
        <ambientLight intensity={0.5} />
      </Canvas>
    </div>
  )
}

export default ParticleField3D
