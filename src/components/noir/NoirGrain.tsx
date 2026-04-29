import { CSSProperties } from 'react'

interface NoirGrainProps {
  /** Opacity 0-1. Default 0.4 — perceptível sem dominar. */
  opacity?: number
  /** Scale do ruído. Maior = grão mais "fino". Default 0.85. */
  baseFrequency?: number
  /** "global" cobre fixed; "local" preenche o pai (precisa relative + overflow-hidden). */
  scope?: 'global' | 'local'
}

/**
 * Texture de ruído analógico via SVG feTurbulence inline. Sem rede, sem PNG.
 * Aplicado como overlay com mix-blend-mode pra respirar com o conteúdo embaixo.
 */
export function NoirGrain({
  opacity = 0.4,
  baseFrequency = 0.85,
  scope = 'global',
}: NoirGrainProps) {
  const positionStyle: CSSProperties =
    scope === 'global'
      ? { position: 'fixed', inset: 0, zIndex: 1 }
      : { position: 'absolute', inset: 0 }

  const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`,
  )}`

  return (
    <div
      aria-hidden
      className="pointer-events-none mix-blend-overlay"
      style={{
        ...positionStyle,
        opacity,
        backgroundImage: `url("${svgDataUri}")`,
        backgroundRepeat: 'repeat',
      }}
    />
  )
}
