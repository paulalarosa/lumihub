import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
}

export const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)

  const _placeholder =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23171717" width="400" height="300"/%3E%3C/svg%3E'

  return (
    <div className={cn('relative overflow-hidden bg-neutral-900', className)}>
      {}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/5 border-t-white/30 rounded-full animate-spin" />
        </div>
      )}

      {}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'w-full h-full object-cover transition-all duration-700 ease-in-out',
          isLoaded
            ? 'opacity-100 scale-100 blur-0'
            : 'opacity-0 scale-105 blur-lg',
          error && 'hidden',
        )}
      />

      {}
      {error && (
        <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950 border border-white/5 space-y-2">
          <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
            Load_Failure
          </span>
          <div className="h-px w-8 bg-zinc-800" />
        </div>
      )}
    </div>
  )
}
