import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FieldType = "input" | "select" | "textarea" | "checkbox" | "date";

interface FormSkeletonProps {
    fields?: FieldType[];
    columns?: 1 | 2;
    withSubmit?: boolean;
    className?: string;
}

const fieldHeights: Record<FieldType, string> = {
    input: "h-10",
    select: "h-10",
    textarea: "h-24",
    checkbox: "h-5",
    date: "h-10",
};

export function FormSkeleton({
    fields = ["input", "input", "select", "textarea"],
    columns = 1,
    withSubmit = true,
    className,
}: FormSkeletonProps) {
    return (
        <div
            className={cn("space-y-4", className)}
            role="status"
            aria-busy="true"
            aria-label="Carregando formulário"
        >
            <div
                className={cn(
                    "grid gap-4",
                    columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                )}
            >
                {fields.map((field, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton
                            className={cn("w-full", fieldHeights[field])}
                            shape="rounded"
                        />
                    </div>
                ))}
            </div>

            {withSubmit && (
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                    <Skeleton className="h-10 w-24" shape="rounded" />
                    <Skeleton className="h-10 w-32" shape="rounded" />
                </div>
            )}
        </div>
    );
}

export function FormFieldSkeleton({ type = "input" }: { type?: FieldType }) {
    return (
        <div className="space-y-2" role="status" aria-busy="true">
            <Skeleton className="h-3 w-20" />
            <Skeleton className={cn("w-full", fieldHeights[type])} shape="rounded" />
        </div>
    );
}

export default FormSkeleton;
