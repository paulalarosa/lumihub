import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-black border border-white/10 text-white hover:border-[#00e5ff] hover:text-[#00e5ff] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] backdrop-blur-md",
        primary: "bg-[#00e5ff] text-black font-semibold hover:bg-[#00e5ff]/80 shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] border-none",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-white/10 bg-transparent text-[#C0C0C0] hover:bg-white/5 hover:text-white hover:border-white/20",
        secondary: "bg-white/5 text-[#C0C0C0] hover:bg-white/10 hover:text-white border border-white/5",
        ghost: "hover:bg-white/5 hover:text-[#00e5ff]",
        link: "text-[#00e5ff] underline-offset-4 hover:underline",
        accent: "bg-[#C0C0C0] text-black hover:bg-white shadow-[0_0_15px_rgba(192,192,192,0.3)]",
        hero: "bg-gradient-to-r from-[#00e5ff] to-[#00b2cc] text-black font-bold hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transform hover:scale-105",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
