import { CSSProperties, useEffect, useState } from 'react'

interface NoirGrainProps {
  /** Opacity 0-1. Default 0.55 — perceptível no preto sem dominar. */
  opacity?: number
  /** Base frequency do ruído. Menor = grão mais grosso/orgânico. Default 0.65. */
  baseFrequency?: number
  /** Octaves (camadas de ruído). Mais = mais detalhe orgânico. Default 4. */
  numOctaves?: number
  /** Anima drift sutil pra dar sensação cinematográfica viva. Default true. */
  animated?: boolean
  /** "global" cobre fixed; "local" preenche o pai (precisa relative + overflow-hidden). */
  scope?: 'global' | 'local'
}

/**
 * Texture de ruído analógico via SVG feTurbulence multi-octave. Animação sutil
 * de drift cria sensação de filme rodando, não-estático. Mix-blend-overlay pra
 * respirar com o conteúdo embaixo.
 *
 * Dois layers sobrepostos com frequências diferentes criam grão menos uniforme
 * (combate o look "synthetic" do feTurbulence single-octave).
 */
export function NoirGrain({
  opacity = 0.55,
  baseFrequency = 0.65,
  numOctaves = 4,
  animated = true,
  scope = 'global',
}: NoirGrainProps) {
  const [seed, setSeed] = useState(0)

  useEffect(() => {
    if (!animated) return
    let raf = 0
    const tick = () => {
      setSeed((s) => (s + 1) % 8)
      raf = window.setTimeout(tick, 90) as unknown as number
    }
    raf = window.setTimeout(tick, 90) as unknown as number
    return () => clearTimeout(raf)
  }, [animated])

  const positionStyle: CSSProperties =
    scope === 'global'
      ? { position: 'fixed', inset: 0, zIndex: 1 }
      : { position: 'absolute', inset: 0 }

  // Layer 1: grão grosso, mais visível
  const grainLayer1 = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n1' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='${numOctaves}' seed='${seed}' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 1.4 0'/></filter><rect width='100%' height='100%' filter='url(%23n1)'/></svg>`,
  )}`

  // Layer 2: grão fino, dá segundo nível de textura
  const grainLayer2 = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><filter id='n2' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' seed='${(seed + 3) % 8}' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.8 0'/></filter><rect width='100%' height='100%' filter='url(%23n2)'/></svg>`,
  )}`

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none"
        style={{
          ...positionStyle,
          opacity,
          backgroundImage: `url("${grainLayer1}")`,
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none"
        style={{
          ...positionStyle,
          opacity: opacity * 0.5,
          backgroundImage: `url("${grainLayer2}")`,
          backgroundRepeat: 'repeat',
          mixBlendMode: 'soft-light',
        }}
      />
    </>
  )
}
