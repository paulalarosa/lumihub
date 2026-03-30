import type { ComponentProps } from "react";

import React, { Suspense } from "react";
import { cn } from "@/lib/utils";

const PanelPrimitive = React.lazy(() => import('@xyflow/react').then(m => ({ default: m.Panel })));

export type PanelProps = ComponentProps<typeof PanelPrimitive>;

export const Panel = ({ className, ...props }: PanelProps) => (
  <Suspense fallback={null}>
    <PanelPrimitive
      className={cn(
        "m-4 overflow-hidden rounded-md border bg-card p-1",
        className
      )}
      {...props}
    />
  </Suspense>
);
