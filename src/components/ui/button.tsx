import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-white text-black font-bold hover:bg-white/90 shadow-lg shadow-black/20 rounded-none',
        secondary:
          'bg-white/5 text-white hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 shadow-lg shadow-black/10 rounded-full',
        glass:
          'bg-white/10 text-white hover:bg-white/15 backdrop-blur-2xl border border-white/20 hover:border-white/30 shadow-2xl shadow-black/20 rounded-full',
        ghost:
          'bg-transparent text-white hover:bg-white/5 border-none rounded-full',
        outline:
          'border border-white/20 bg-transparent hover:bg-white/5 text-white rounded-full',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-6 text-base',
        sm: 'h-10 px-5 text-sm',
        md: 'h-12 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={props.disabled || isLoading}
        {...props}
      >
        {variant === 'primary' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          {isLoading && <span className="animate-spin mr-2">◌</span>}
          {children}
        </span>
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
