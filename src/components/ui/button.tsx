import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-black border border-white/20 text-white hover:bg-white hover:text-black hover:border-white transition-all duration-300",
        primary: "bg-white text-black font-semibold hover:bg-neutral-200 border border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive",
        outline: "border border-white/20 bg-transparent text-white hover:bg-white hover:text-black",
        secondary: "bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-800",
        ghost: "hover:bg-white/10 hover:text-white text-neutral-400",
        link: "text-white underline-offset-4 hover:underline",
        accent: "bg-white text-black hover:bg-neutral-200",
        hero: "bg-white text-black font-bold uppercase tracking-widest hover:bg-neutral-200 border border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]",
      },
      size: {
        default: "h-10 px-6 py-2 rounded-none",
        sm: "h-9 rounded-none px-4",
        lg: "h-12 rounded-none px-10",
        icon: "h-10 w-10 rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button;
    // @ts-ignore: Radix Slot doesn't accept dragging/motion props easily, so we skip motion if asChild is true for now
    const motionProps = !asChild ? {
      whileTap: { scale: 0.95 },
      transition: { duration: 0.1 }
    } : {};

    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} {...(motionProps as any)} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
