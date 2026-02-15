import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon?: ReactNode;
    trend?: number;
    loading?: boolean;
    className?: string;
}

export function MetricCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    loading = false,
    className,
}: MetricCardProps) {
    const getTrendIcon = () => {
        if (trend === undefined || trend === 0) {
            return <Minus className="h-3 w-3 text-neutral-500" />;
        }
        if (trend > 0) {
            return <TrendingUp className="h-3 w-3 text-green-500" />;
        }
        return <TrendingDown className="h-3 w-3 text-red-500" />;
    };

    const getTrendColor = () => {
        if (trend === undefined || trend === 0) return "text-neutral-500";
        if (trend > 0) return "text-green-500";
        return "text-red-500";
    };

    if (loading) {
        return (
            <Card className={cn(
                "bg-neutral-900 border-neutral-700 rounded-none",
                className
            )}>
                <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-4 bg-neutral-800" />
                    <Skeleton className="h-10 w-20 mb-2 bg-neutral-800" />
                    <Skeleton className="h-3 w-16 bg-neutral-800" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "bg-neutral-900 border-neutral-700 rounded-none hover:border-neutral-600 transition-colors",
            className
        )}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                        {title}
                    </span>
                    {icon && (
                        <div className="w-8 h-8 bg-neutral-800 flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-4xl font-bold text-white font-mono tracking-tight">
                            {value}
                        </div>
                        {subtitle && (
                            <div className="text-xs text-neutral-500 font-mono mt-1">
                                {subtitle}
                            </div>
                        )}
                    </div>

                    {trend !== undefined && (
                        <div className={cn(
                            "flex items-center gap-1 font-mono text-xs",
                            getTrendColor()
                        )}>
                            {getTrendIcon()}
                            <span>{Math.abs(trend)}%</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default MetricCard;
