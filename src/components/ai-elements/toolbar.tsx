import type { ComponentProps } from "react";

import React, { Suspense } from "react";
import { cn } from "@/lib/utils";

const NodeToolbarPrimitive = React.lazy(() => import('@xyflow/react').then(m => ({ default: m.NodeToolbar })));

export type ToolbarProps = ComponentProps<typeof NodeToolbarPrimitive>;

export const Toolbar = ({ className, ...props }: ToolbarProps) => (
  <Suspense fallback={null}>
    <NodeToolbarPrimitive
      className={cn(
        "flex items-center gap-1 rounded-sm border bg-background p-1.5",
        className
      )}
      position={"bottom" as any}
      {...props}
    />
  </Suspense>
);
