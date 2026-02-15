import { cn } from "@/lib/utils";

type SkeletonVariant = "pulse" | "wave" | "shimmer";
type SkeletonSize = "sm" | "md" | "lg" | "xl";
type SkeletonShape = "rectangle" | "circle" | "rounded";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  size?: SkeletonSize;
  shape?: SkeletonShape;
  width?: string | number;
  height?: string | number;
}

const sizeMap: Record<SkeletonSize, string> = {
  sm: "h-3",
  md: "h-4",
  lg: "h-6",
  xl: "h-10",
};

const shapeMap: Record<SkeletonShape, string> = {
  rectangle: "rounded-none",
  circle: "rounded-full",
  rounded: "rounded-md",
};

function Skeleton({
  className,
  variant = "shimmer",
  size = "md",
  shape = "rounded",
  width,
  height,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    pulse: "animate-pulse bg-neutral-800/50",
    wave: "skeleton-wave bg-neutral-800/50",
    shimmer: "skeleton-shimmer bg-neutral-800/50",
  };

  const style: React.CSSProperties = {
    ...(width && { width: typeof width === "number" ? `${width}px` : width }),
    ...(height && { height: typeof height === "number" ? `${height}px` : height }),
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        sizeMap[size],
        shapeMap[shape],
        variantStyles[variant],
        className
      )}
      style={style}
      role="status"
      aria-busy="true"
      aria-label="Carregando"
      {...props}
    />
  );
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-busy="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("w-full", i === lines - 1 && "w-3/4")}
          size="sm"
        />
      ))}
    </div>
  );
}

function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  return <Skeleton shape="circle" className={sizes[size]} />;
}

function SkeletonButton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-8 w-20", md: "h-10 w-28", lg: "h-12 w-36" };
  return <Skeleton className={sizes[size]} />;
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton };
export type { SkeletonVariant, SkeletonSize, SkeletonShape };
