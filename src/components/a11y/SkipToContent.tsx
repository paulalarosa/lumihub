import { cn } from "@/lib/utils";

export const SkipToContent = () => {
    return (
        <a
            href="#main-content"
            className={cn(
                "sr-only focus:not-sr-only focus:absolute focus:z-[99999]",
                "focus:top-6 focus:left-6 focus:px-6 focus:py-4",
                "bg-black text-white border-2 border-white",
                "font-mono text-sm uppercase tracking-widest font-bold",
                "transition-none shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
            )}
        >
            :: Skip To Content ::
        </a>
    );
};
