import { ReactNode } from 'react'
import { NoirGrain } from './NoirGrain'
import { BigTextBackdrop } from './BigTextBackdrop'

interface NoirLayoutProps {
  children: ReactNode
  /** Palavra gigante backdrop (opcional). */
  bigText?: string
  bigTextSize?: number
  bigTextAnchor?: 'top' | 'middle' | 'bottom'
  /** Desabilita o noise global se a página tiver layout próprio. */
  noGrain?: boolean
}

/**
 * Wrapper que aplica a estética Noir do Khaos Kontrol:
 * - bg preto base
 * - grão SVG global (mix-blend-overlay)
 * - 2 glow gradients radiais brancos sutis (canto sup-direito + inf-esquerdo)
 * - tipografia gigante no fundo (opcional)
 *
 * Conteúdo deve ficar em z-10+ pra ficar acima das camadas decorativas.
 */
export function NoirLayout({
  children,
  bigText,
  bigTextSize,
  bigTextAnchor,
  noGrain = false,
}: NoirLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {!noGrain && <NoirGrain opacity={0.35} baseFrequency={0.9} scope="global" />}

      {/* Glow canto sup-direito */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-[-20%] right-[-15%] w-[55%] h-[55%] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 60%)',
          filter: 'blur(120px)',
          zIndex: 2,
        }}
      />

      {/* Glow canto inf-esquerdo (mais sutil, contrabalança) */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-[-25%] left-[-15%] w-[50%] h-[50%] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
          filter: 'blur(140px)',
          zIndex: 2,
        }}
      />

      {bigText && (
        <BigTextBackdrop
          text={bigText}
          size={bigTextSize}
          anchor={bigTextAnchor}
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  )
}
