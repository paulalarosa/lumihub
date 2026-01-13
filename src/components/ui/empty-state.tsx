import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-16 px-4 text-center bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm",
            className
        )}>
            <div className="w-16 h-16 bg-[#00e5ff]/10 rounded-full flex items-center justify-center mb-6 border border-[#00e5ff]/20 shadow-[0_0_30px_rgba(0,229,255,0.15)]">
                <Icon className="h-8 w-8 text-[#00e5ff]" />
            </div>
            <h3 className="font-serif text-2xl font-medium text-white mb-2">
                {title}
            </h3>
            <p className="text-white/50 mb-8 max-w-sm mx-auto leading-relaxed">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    className="bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90 h-10 px-8 rounded-full font-medium"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
