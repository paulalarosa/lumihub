interface BigTextBackdropProps {
  text: string
  /** vw size. Default 18. */
  size?: number
  /** vertical anchor. Default "top". */
  anchor?: 'top' | 'middle' | 'bottom'
  /** opacity 0-1. Default 0.06. */
  opacity?: number
}

/**
 * Tipografia gigante atrás do conteúdo, blurred, criando profundidade
 * e identidade. Inspirado nas refs de pricing pages com palavra-chave gigante
 * por trás dos cards.
 */
export function BigTextBackdrop({
  text,
  size = 18,
  anchor = 'top',
  opacity = 0.06,
}: BigTextBackdropProps) {
  const topClass =
    anchor === 'top'
      ? 'top-[8%]'
      : anchor === 'middle'
        ? 'top-1/2 -translate-y-1/2'
        : 'bottom-[8%]'

  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none absolute inset-x-0 ${topClass} text-center z-[2]`}
    >
      <span
        className="font-serif font-black tracking-tighter blur-sm"
        style={{
          fontSize: `${size}vw`,
          color: `rgba(255,255,255,${opacity})`,
          lineHeight: 1,
        }}
      >
        {text}
      </span>
    </div>
  )
}
