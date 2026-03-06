import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'white' | 'black'
  className?: string
}

const sizes: Record<string, string> = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-base',
}

const variants: Record<string, string> = {
  default: 'bg-white text-black',
  white: 'bg-white text-black',
  black: 'bg-black text-white border border-white/20',
}

export const Logo = ({
  size = 'md',
  variant = 'default',
  className,
}: LogoProps) => {
  return (
    <div
      className={cn(
        'rounded flex items-center justify-center flex-shrink-0',
        sizes[size],
        variants[variant],
        className,
      )}
    >
      <span className="font-bold">K</span>
    </div>
  )
}
