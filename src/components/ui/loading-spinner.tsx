import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    className?: string; // Additional classes for the container
    size?: number; // Size in pixels, default 24
    label?: string; // Optional text label below
}

export function LoadingSpinner({ className, size = 24, label }: LoadingSpinnerProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <div
                className="animate-spin text-white/80"
                style={{ width: size, height: size }}
            >
                <Loader2 className="w-full h-full" />
            </div>
            {label && (
                <span className="font-mono text-xs uppercase tracking-widest text-white/50 animate-pulse">
                    {label}
                </span>
            )}
        </div>
    );
}

// Full screen variant
export function PageLoader({ text = "Carregando..." }: { text?: string }) {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center fixed inset-0 z-50">
            <div className="relative">
                <div className="w-16 h-16 border border-white/10 rounded-full absolute top-0 left-0 animate-ping opacity-20" />
                <div className="w-16 h-16 border-t-2 border-white rounded-full animate-spin" />
            </div>
            <div className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                {text}
            </div>
        </div>
    );
}
