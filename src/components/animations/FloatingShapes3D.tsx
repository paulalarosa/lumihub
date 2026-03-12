import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

const FloatingShape = ({
  position,
  color,
  speed,
}: {
  position: [number, number, number]
  color: string
  speed: number
}) => {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.getElapsedTime()

    // Rotação suave
    meshRef.current.rotation.x = Math.sin(time * speed) * 0.3
    meshRef.current.rotation.y = Math.cos(time * speed * 0.8) * 0.3
  })

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.6}
          distort={0.3}
          speed={2}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
    </Float>
  )
}

export const FloatingShapes3D = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* Múltiplas shapes flutuantes */}
        <FloatingShape position={[-2, 1, 0]} color="#8B5CF6" speed={1.2} />
        <FloatingShape position={[2, -1, -1]} color="#EC4899" speed={0.8} />
        <FloatingShape position={[0, 2, -2]} color="#3B82F6" speed={1.5} />
      </Canvas>
    </div>
  )
}
