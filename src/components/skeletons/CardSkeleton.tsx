import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardSkeletonProps {
    withIcon?: boolean;
    withChart?: boolean;
    withTrend?: boolean;
    className?: string;
}

export function CardSkeleton({
    withIcon = true,
    withChart = false,
    withTrend = true,
    className,
}: CardSkeletonProps) {
    return (
        <Card
            className={cn(
                "bg-neutral-900 border-neutral-700 rounded-none",
                className
            )}
            role="status"
            aria-busy="true"
            aria-label="Carregando card"
        >
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-3 w-24" />
                    {withIcon && <Skeleton className="h-8 w-8" shape="rounded" />}
                </div>

                <div className="flex items-end justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-20" size="xl" />
                        <Skeleton className="h-2 w-16" />
                    </div>

                    {withTrend && (
                        <div className="flex items-center gap-1">
                            <Skeleton className="h-3 w-3" shape="rounded" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                    )}
                </div>

                {withChart && (
                    <div className="mt-4 pt-4 border-t border-neutral-800">
                        <Skeleton className="h-16 w-full" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function CardSkeletonGrid({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

export default CardSkeleton;
