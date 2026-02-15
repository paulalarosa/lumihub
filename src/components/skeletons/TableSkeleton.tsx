import { Skeleton, SkeletonAvatar } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
    className?: string;
}

export function TableSkeleton({
    rows = 5,
    columns = 4,
    showHeader = true,
    className,
}: TableSkeletonProps) {
    return (
        <div
            className={cn("w-full", className)}
            role="status"
            aria-busy="true"
            aria-label="Carregando tabela"
        >
            {showHeader && (
                <div className="flex gap-4 py-3 border-b border-neutral-700 mb-2">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton
                            key={`header-${i}`}
                            className={cn(
                                "h-3",
                                i === 0 ? "w-32" : "flex-1"
                            )}
                        />
                    ))}
                </div>
            )}

            <div className="space-y-1">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={`row-${rowIndex}`}
                        className="flex items-center gap-4 py-4 border-b border-neutral-800/50"
                    >
                        {columns >= 1 && (
                            <div className="flex items-center gap-3 w-40">
                                <SkeletonAvatar size="sm" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-2 w-16" />
                                </div>
                            </div>
                        )}

                        {Array.from({ length: Math.max(0, columns - 2) }).map((_, colIndex) => (
                            <Skeleton
                                key={`cell-${rowIndex}-${colIndex}`}
                                className="flex-1 h-3"
                            />
                        ))}

                        {columns >= 2 && (
                            <div className="flex gap-2 ml-auto">
                                <Skeleton className="h-8 w-8" shape="rounded" />
                                <Skeleton className="h-8 w-8" shape="rounded" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TableSkeleton;
