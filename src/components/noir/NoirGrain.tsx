import { CSSProperties, useMemo } from 'react'

interface NoirGrainProps {
  /** Opacity 0-1. Default 0.85 — bem visível pra dar punch. */
  opacity?: number
  /** Frequência base. Menor = grão mais grosso. Default 0.55. */
  baseFrequency?: number
  /** Octaves. Mais = mais detalhe orgânico. Default 5. */
  numOctaves?: number
  /** "global" cobre fixed; "local" preenche o pai. */
  scope?: 'global' | 'local'
  /** Seed para variação. Default 0. */
  seed?: number
}

/**
 * Texture de ruído analógico via SVG feTurbulence multi-octave + displacement.
 * Mais grosso e visível que noise convencional. Mix-blend-mode soft-light pra
 * preto e branco puros — o grão "carcomendo" o preto perfeito da página.
 *
 * 3 layers sobrepostos com frequencies, opacities e blend modes diferentes
 * cria textura de filme analógico real (ISO ~1600). Sem animação por
 * default — animação distraía e não acrescentava qualidade.
 */
export function NoirGrain({
  opacity = 0.85,
  baseFrequency = 0.55,
  numOctaves = 5,
  scope = 'global',
  seed = 0,
}: NoirGrainProps) {
  const positionStyle: CSSProperties =
    scope === 'global'
      ? { position: 'fixed', inset: 0, zIndex: 1 }
      : { position: 'absolute', inset: 0 }

  // Layer 1: grão grosso, contraste alto
  const layer1 = useMemo(
    () =>
      `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'><filter id='g1'><feTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='${numOctaves}' seed='${seed}' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 2.2 -0.2'/></filter><rect width='100%' height='100%' filter='url(%23g1)'/></svg>`,
      )}`,
    [baseFrequency, numOctaves, seed],
  )

  // Layer 2: grão fino, dá segunda camada de detalhe
  const layer2 = useMemo(
    () =>
      `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='g2'><feTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='3' seed='${seed + 7}' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 1.5 0'/></filter><rect width='100%' height='100%' filter='url(%23g2)'/></svg>`,
      )}`,
    [seed],
  )

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none"
        style={{
          ...positionStyle,
          opacity,
          backgroundImage: `url("${layer1}")`,
          backgroundSize: '400px 400px',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'soft-light',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none"
        style={{
          ...positionStyle,
          opacity: opacity * 0.4,
          backgroundImage: `url("${layer2}")`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay',
        }}
      />
    </>
  )
}
