import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, TorusKnot } from '@react-three/drei'
import * as THREE from 'three'

function AnimatedGlassShape() {
  const meshRef = useRef<THREE.Mesh>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    // Slow organic rotation
    meshRef.current.rotation.x = Math.sin(t / 4) / 2
    meshRef.current.rotation.y = t / 4
    meshRef.current.rotation.z = Math.cos(t / 4) / 2

    // Gentle floating
    meshRef.current.position.y = Math.sin(t / 2) * 0.2

    // Mouse interaction (smooth parallax)
    const mouseX = (state.pointer.x * Math.PI) / 10
    const mouseY = (state.pointer.y * Math.PI) / 10

    meshRef.current.rotation.x += mouseY * 0.5
    meshRef.current.rotation.y += mouseX * 0.5
  })

  return (
    <TorusKnot ref={meshRef} args={[1, 0.4, 128, 32]}>
      <MeshTransmissionMaterial
        ref={materialRef}
        samples={16}
        resolution={512}
        transmission={0.95}
        roughness={0.1}
        thickness={1.5}
        ior={1.5}
        chromaticAberration={0.06}
        anisotropy={0.1}
        distortion={0.5}
        distortionScale={0.3}
        temporalDistortion={0.1}
        clearcoat={1}
        attenuationDistance={0.5}
        attenuationColor="#ffffff"
        color="#ffffff"
      />
    </TorusKnot>
  )
}

export function Hero3DBackground() {
  return (
    <div className="absolute inset-0 z-[-1] pointer-events-none opacity-60 mix-blend-screen">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1.5}
          color="#c084fc"
        />
        <directionalLight
          position={[-10, -10, -10]}
          intensity={1}
          color="#ffffff"
        />
        <pointLight
          position={[0, 0, 0]}
          intensity={2}
          color="#8b5cf6"
          distance={10}
        />
        <AnimatedGlassShape />
      </Canvas>
    </div>
  )
}
