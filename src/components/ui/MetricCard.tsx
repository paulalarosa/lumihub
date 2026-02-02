import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface MetricCardProps {
    label: string;
    value: number | string | undefined;
    isLoading?: boolean;
    className?: string;
}

export const MetricCard = ({ label, value, isLoading, className }: MetricCardProps) => {
    return (
        <div className={cn(
            "border-2 border-black bg-white p-4 flex flex-col justify-between min-h-[120px]",
            className
        )}>
            <div className="font-bold text-[10px] uppercase tracking-widest text-black/60 mb-2">
                {label}
            </div>

            <div className="flex items-end justify-between">
                {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-black/20" />
                ) : (
                    <div className="font-mono font-bold text-5xl text-black tracking-tighter leading-none">
                        {value}
                    </div>
                )}

                {/* Decorative Industrial Element */}
                <div className="h-2 w-2 bg-black rounded-none" />
            </div>
        </div>
    );
};
